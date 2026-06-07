import { deleteCookie, getCookie } from "h3";

import { GET_CHECKOUT_URL } from "../../../graphql/getCheckoutUrl";

const CART_COOKIE = "mean-mugs-cart-id";
const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/.+\?key=.+$/;

function isValidCartId(cartId: string): boolean {
  return CART_ID_PATTERN.test(cartId);
}

export default defineEventHandler(async (event) => {
  const cartId = getCookie(event, CART_COOKIE);

  if (!cartId) {
    throw createError({
      statusCode: 404,
      statusMessage: "No active cart",
    });
  }

  if (!isValidCartId(cartId)) {
    deleteCookie(event, CART_COOKIE, {
      path: "/",
    });

    throw createError({
      statusCode: 404,
      statusMessage: "No active cart",
    });
  }

  const storefront = useStorefront();

  try {
    const response = await storefront.request(GET_CHECKOUT_URL, {
      variables: {
        id: cartId,
      },
    });

    const checkoutUrl = response.data?.cart?.checkoutUrl;

    if (!checkoutUrl) {
      deleteCookie(event, CART_COOKIE, {
        path: "/",
      });

      throw createError({
        statusCode: 404,
        statusMessage: "No active cart",
      });
    }

    return { checkoutUrl };
  }
  catch (error) {
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
