import { GET_PRODUCT_BY_ID } from "../../../graphql/getProductById";

export function useGetProductById(id: string) {
  return useStorefrontData(`product-${id}`, GET_PRODUCT_BY_ID, { variables: { id } });
}
