import { GET_PRODUCTS_IN_COLLECTION_BY_COLLECTION_HANDLE } from "../../../graphql/getProductsInCollectionByCollectionHandle";

export function useGetProductsInCollectionByCollectionHandle(handle: string) {
  return useStorefrontData(`collection-${handle}`, GET_PRODUCTS_IN_COLLECTION_BY_COLLECTION_HANDLE, { variables: { handle } });
}
