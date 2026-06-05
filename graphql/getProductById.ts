export const GET_PRODUCT_BY_ID = `#graphql
query getProductById($id: ID!) {
  product(id: $id) {
    id
    title
    variants(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }
}
`;
