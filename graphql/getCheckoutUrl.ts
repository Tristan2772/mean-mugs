export const GET_CHECKOUT_URL = `#graphql
query getCheckoutUrl($id: ID!) {
  cart(id: $id) {
    checkoutUrl
  }
}
`;
