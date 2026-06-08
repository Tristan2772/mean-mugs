export const CART_LINES_UPDATE = `#graphql
mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart {
      id
      totalQuantity
    }
    userErrors {
      field
      message
    }
  }
}
`;
