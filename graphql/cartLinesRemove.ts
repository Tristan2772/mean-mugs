export const CART_LINES_REMOVE = `#graphql
mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
