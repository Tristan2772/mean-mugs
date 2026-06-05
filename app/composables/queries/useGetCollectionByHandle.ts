import { GET_COLLECTION_BY_HANDLE } from "../../../graphql/getCollectionByHandle";

export function useGetCollectionByHandle(handle: string) {
  return useStorefrontData(`collection-${handle}`, GET_COLLECTION_BY_HANDLE, { variables: { handle } });
}
