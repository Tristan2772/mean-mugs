import { deleteCookie, getCookie } from "h3";

import { GET_CURRENT_CART } from "../../../graphql/getCurrentCart";

const CART_COOKIE = "mean-mugs-cart-id";
const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/.+\?key=.+$/;

function isValidCartId(cartId: string): boolean {
  return CART_ID_PATTERN.test(cartId);
}

function toPublicCart(cart: {
  totalQuantity?: number | null;
  cost?: {
    totalAmount?: {
      amount?: string | null;
      currencyCode?: string | null;
    } | null;
  } | null;
  lines?: {
    nodes?: unknown[];
  } | null;
} | null | undefined) {
  if (!cart) {
    return null;
  }

  return {
    totalQuantity: cart.totalQuantity ?? 0,
    cost: cart.cost ?? null,
    lines: {
      nodes: cart.lines?.nodes ?? [],
    },
  };
}

export default defineEventHandler(async (event) => {
  // Read the cart ID from the request cookie.
  const cartId = getCookie(event, CART_COOKIE);

  // If no cart is associated with this visitor yet, return an empty cart state.
  if (!cartId) {
    return { cart: null };
  }

  // Cart IDs must include Shopify's secret key segment ("?key=...").
  if (!isValidCartId(cartId)) {
    deleteCookie(event, CART_COOKIE, {
      path: "/",
    });

    return { cart: null };
  }

  // Fetch the current cart details from Shopify using the stored cart ID.
  const storefront = useStorefront();
  try {
    const response = await storefront.request(GET_CURRENT_CART, {
      variables: {
        id: cartId,
      },
    });

    if (!response.data?.cart) {
      deleteCookie(event, CART_COOKIE, {
        path: "/",
      });
    }

    // Return a safe cart representation without leaking the secret-bearing ID.
    return {
      cart: toPublicCart(response.data?.cart),
    };
  }
  catch (error) {
    const message = String(error);

    if (/does not exist|invalid/i.test(message)) {
      deleteCookie(event, CART_COOKIE, {
        path: "/",
      });

      return { cart: null };
    }

    throw error;
  }
});
