import { deleteCookie, getCookie, setCookie } from "h3";

import { CART_LINES_REMOVE } from "../../../../graphql/cartLinesRemove";

// Shared cart security constants.
const CART_COOKIE = "mean-mugs-cart-id";
const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/.+\?key=.+$/;
const CART_LINE_ID_PATTERN = /^gid:\/\/shopify\/CartLine\/.+$/;

// Cookie settings used whenever Shopify rotates cart IDs.
const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: !import.meta.dev,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

// Request payload expected from the cart page.
type RemoveCartLineBody = {
  lineId?: string;
};

// Verify cart IDs include the Shopify secret key segment.
function isValidCartId(cartId: string): boolean {
  return CART_ID_PATTERN.test(cartId);
}

// Verify line IDs are valid global IDs for cart lines.
function isValidCartLineId(lineId: string): boolean {
  return CART_LINE_ID_PATTERN.test(lineId);
}

export default defineEventHandler(async (event) => {
  // Parse and validate client input before touching Shopify.
  const body = await readBody<RemoveCartLineBody>(event);
  const lineId = body?.lineId?.trim();

  if (!lineId || !isValidCartLineId(lineId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A valid lineId is required",
    });
  }

  // Resolve cart from secure server cookie only.
  const cartId = getCookie(event, CART_COOKIE);

  if (!cartId || !isValidCartId(cartId)) {
    if (cartId) {
      deleteCookie(event, CART_COOKIE, {
        path: "/",
      });
    }

    throw createError({
      statusCode: 404,
      statusMessage: "No active cart",
    });
  }

  // Forward the validated mutation to Shopify Storefront API.
  const storefront = useStorefront();

  try {
    const response = await storefront.request(CART_LINES_REMOVE, {
      variables: {
        cartId,
        lineIds: [lineId],
      },
    });

    const cartLinesRemove = response.data?.cartLinesRemove;
    const firstError = cartLinesRemove?.userErrors?.[0];

    // Normalize Shopify user errors to HTTP responses.
    if (firstError) {
      if (/does not exist|invalid/i.test(firstError.message)) {
        deleteCookie(event, CART_COOKIE, {
          path: "/",
        });

        throw createError({
          statusCode: 404,
          statusMessage: "No active cart",
        });
      }

      throw createError({
        statusCode: 400,
        statusMessage: firstError.message,
      });
    }

    // Keep cookie synchronized if Shopify returns a rotated cart ID.
    if (cartLinesRemove?.cart?.id) {
      setCookie(event, CART_COOKIE, cartLinesRemove.cart.id, CART_COOKIE_OPTIONS);
    }

    // Return minimal public cart state.
    return {
      cart: {
        totalQuantity: cartLinesRemove?.cart?.totalQuantity ?? 0,
      },
    };
  }
  catch (error) {
    // Treat invalid/missing carts as recoverable by clearing local cart cookie.
    const message = String(error);

    if (/does not exist|invalid/i.test(message)) {
      deleteCookie(event, CART_COOKIE, {
        path: "/",
      });

      throw createError({
        statusCode: 404,
        statusMessage: "No active cart",
      });
    }

    throw error;
  }
});
