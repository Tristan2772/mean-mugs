import { getCookie } from "h3";

import { GET_CURRENT_CART } from "../../../graphql/getCurrentCart";

const CART_COOKIE = "mean-mugs-cart-id";

export default defineEventHandler(async (event) => {
  const cartId = getCookie(event, CART_COOKIE);

  if (!cartId) {
    return { cart: null };
  }

  const storefront = useStorefront();
  const response = await storefront.request(GET_CURRENT_CART, {
    variables: {
      id: cartId,
    },
  });

  return {
    cart: response.data?.cart ?? null,
  };
});
