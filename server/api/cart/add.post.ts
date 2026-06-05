import { getCookie, setCookie } from "h3";

import { CART_CREATE } from "../../../graphql/cartCreate";
import { CART_LINES_ADD } from "../../../graphql/cartLinesAdd";
import { GET_PRODUCT_BY_ID } from "../../../graphql/getProductById";

const CART_COOKIE = "mean-mugs-cart-id";

type AddToCartBody = {
  productId?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<AddToCartBody>(event);
  const productId = body?.productId?.trim();

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "productId is required",
    });
  }

  const storefront = useStorefront();
  const productResponse = await storefront.request(GET_PRODUCT_BY_ID, {
    variables: {
      id: productId,
    },
  });

  const product = productResponse.data?.product;
  const variantId = product?.variants?.nodes?.[0]?.id;

  if (!variantId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product variant not found",
    });
  }

  const cartId = getCookie(event, CART_COOKIE);

  if (cartId) {
    const cartLinesResponse = await storefront.request(CART_LINES_ADD, {
      variables: {
        cartId,
        lines: [{ merchandiseId: variantId, quantity: 1 }],
      },
    });

    const cartLinesAdd = cartLinesResponse.data?.cartLinesAdd;
    const firstError = cartLinesAdd?.userErrors?.[0];

    if (firstError) {
      throw createError({
        statusCode: 400,
        statusMessage: firstError.message,
      });
    }

    if (cartLinesAdd?.cart?.id) {
      setCookie(event, CART_COOKIE, cartLinesAdd.cart.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: !import.meta.dev,
        path: "/",
      });
    }

    return {
      cart: cartLinesAdd?.cart,
      productId,
      variantId,
    };
  }

  const cartCreateResponse = await storefront.request(CART_CREATE, {
    variables: {
      input: {
        lines: [{ merchandiseId: variantId, quantity: 1 }],
      },
    },
  });

  const cartCreate = cartCreateResponse.data?.cartCreate;
  const firstError = cartCreate?.userErrors?.[0];

  if (firstError) {
    throw createError({
      statusCode: 400,
      statusMessage: firstError.message,
    });
  }

  if (cartCreate?.cart?.id) {
    setCookie(event, CART_COOKIE, cartCreate.cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: !import.meta.dev,
      path: "/",
    });
  }

  return {
    cart: cartCreate?.cart,
    productId,
    variantId,
  };
});
