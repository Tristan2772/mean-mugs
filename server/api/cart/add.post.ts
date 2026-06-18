import { deleteCookie, getCookie, setCookie } from "h3";

import { CART_CREATE } from "../../../graphql/cartCreate";
import { CART_LINES_ADD } from "../../../graphql/cartLinesAdd";
import { GET_PRODUCT_BY_ID } from "../../../graphql/getProductById";

const CART_COOKIE = "mean-mugs-cart-id";
const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/.+\?key=.+$/;

const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: !import.meta.dev,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

type AddToCartBody = {
  productId?: string;
  variantId?: string;
};

function isValidCartId(cartId: string): boolean {
  return CART_ID_PATTERN.test(cartId);
}

function toPublicCart(cart: { totalQuantity?: number | null } | null | undefined) {
  if (!cart) {
    return null;
  }

  return {
    totalQuantity: cart.totalQuantity ?? 0,
  };
}

export default defineEventHandler(async (event) => {
  // Parse and validate the incoming request payload.
  const body = await readBody<AddToCartBody>(event);
  const productId = body?.productId?.trim();
  const variantId = body?.variantId?.trim();

  if (!productId && !variantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "productId or variantId is required",
    });
  }

  const storefront = useStorefront();
  let merchandiseId = variantId;

  // Fallback path: resolve a variant from productId when a variantId is not provided.
  if (!merchandiseId && productId) {
    const productResponse = await storefront.request(GET_PRODUCT_BY_ID, {
      variables: {
        id: productId,
      },
    });

    const product = productResponse.data?.product;
    merchandiseId = product?.variants?.nodes?.[0]?.id;
  }

  if (!merchandiseId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product variant not found",
    });
  }

  // Check whether the shopper already has an active cart stored in cookies.
  const rawCartId = getCookie(event, CART_COOKIE);
  const hasValidCartId = Boolean(rawCartId && isValidCartId(rawCartId));

  if (rawCartId && !hasValidCartId) {
    deleteCookie(event, CART_COOKIE, {
      path: "/",
    });
  }

  // If existing cart path: append a new line item.
  if (rawCartId && hasValidCartId) {
    try {
      const cartLinesResponse = await storefront.request(CART_LINES_ADD, {
        variables: {
          cartId: rawCartId,
          lines: [{ merchandiseId, quantity: 1 }],
        },
      });

      const cartLinesAdd = cartLinesResponse.data?.cartLinesAdd;
      const firstError = cartLinesAdd?.userErrors?.[0];

      // If Shopify no longer recognizes this cart ID, clear and recreate a cart below.
      if (firstError && /does not exist/i.test(firstError.message)) {
        deleteCookie(event, CART_COOKIE, {
          path: "/",
        });
      }
      else if (firstError) {
        throw createError({
          statusCode: 400,
          statusMessage: firstError.message,
        });
      }
      else {
        // Refresh the cart cookie in case the cart ID rotates after mutation.
        if (cartLinesAdd?.cart?.id) {
          setCookie(event, CART_COOKIE, cartLinesAdd.cart.id, CART_COOKIE_OPTIONS);
        }

        // Return cart summary only. Keep the secret-bearing cart ID server-side.
        return {
          cart: toPublicCart(cartLinesAdd?.cart),
        };
      }
    }
    catch (error) {
      const message = String(error);
      if (/does not exist|invalid/i.test(message)) {
        deleteCookie(event, CART_COOKIE, {
          path: "/",
        });
      }
      else {
        throw error;
      }
    }
  }

  // No cart exists yet: create one initialized with the requested item.
  const cartCreateResponse = await storefront.request(CART_CREATE, {
    variables: {
      input: {
        lines: [{ merchandiseId, quantity: 1 }],
      },
    },
  });

  const cartCreate = cartCreateResponse.data?.cartCreate;
  const firstError = cartCreate?.userErrors?.[0];

  // Surface cart creation validation errors from Shopify.
  if (firstError) {
    throw createError({
      statusCode: 400,
      statusMessage: firstError.message,
    });
  }

  // Persist the new cart ID so future requests can reuse the same cart.
  if (cartCreate?.cart?.id) {
    setCookie(event, CART_COOKIE, cartCreate.cart.id, CART_COOKIE_OPTIONS);
  }

  // Return cart summary only. Keep the secret-bearing cart ID server-side.
  return {
    cart: toPublicCart(cartCreate?.cart),
  };
});
