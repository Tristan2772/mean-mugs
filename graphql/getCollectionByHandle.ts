export const GET_COLLECTION_BY_HANDLE = `#graphql
query getCollectionByHandle($handle: String!) {
  collection(handle: $handle) {
    id
    title
    description
  }
}
`;
