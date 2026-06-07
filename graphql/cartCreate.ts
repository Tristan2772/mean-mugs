export const CART_CREATE = `#graphql
mutation CartCreate($input: CartInput!) {
  cartCreate(input: $input) {
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
