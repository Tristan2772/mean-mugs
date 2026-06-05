export const GET_CURRENT_CART = `#graphql
query getCurrentCart($id: ID!) {
  cart(id: $id) {
    id
    checkoutUrl
    totalQuantity
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          __typename
          ... on ProductVariant {
            id
            title
            product {
              id
              title
              handle
              images(first: 1) {
                nodes {
                  id
                  url
                  width
                  height
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
