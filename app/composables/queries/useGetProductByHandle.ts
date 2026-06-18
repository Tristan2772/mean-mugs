import { GET_PRODUCT_BY_HANDLE } from "../../../graphql/getProductByHandle";

export function useGetProductByHandle(handle: string) {
  return useStorefrontData(`product-${handle}`, GET_PRODUCT_BY_HANDLE, { variables: { handle } });
}
