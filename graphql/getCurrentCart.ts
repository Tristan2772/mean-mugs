export const GET_CURRENT_CART = `#graphql
query getCurrentCart($id: ID!) {
  cart(id: $id) {
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
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
