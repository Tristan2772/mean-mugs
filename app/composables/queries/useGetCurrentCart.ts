export function useGetCurrentCart() {
  return useFetch("/api/cart/current");
}
