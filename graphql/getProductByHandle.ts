export const GET_PRODUCT_BY_HANDLE = `#graphql
query getProductByHandle($handle: String!) {
  product(handle: $handle) {
    id
    title
    handle
    description
    availableForSale
    variants(first: 10) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        image {
          id
          url
          width
          height
          altText
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
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
`;
