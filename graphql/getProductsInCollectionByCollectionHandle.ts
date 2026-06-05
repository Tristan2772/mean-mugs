export const GET_PRODUCTS_IN_COLLECTION_BY_COLLECTION_HANDLE = `#graphql
query getProductsInCollection($handle: String!) {
  collection(handle: $handle) {
    id
    title
    description
    products(first: 5) {
        nodes {
          id
          title
          handle
          description
          availableForSale
          priceRange {
            minVariantPrice {
              amount
            }
          }
          compareAtPriceRange {
            maxVariantPrice {
              amount
            }
          }
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
`;
