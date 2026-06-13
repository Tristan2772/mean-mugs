import type { Cart, CartLine, CurrentCartResponse } from "~/lib/types";

export function useCartStore() {
  const requestFetch = useRequestFetch();
  const cart = useState<Cart | null>("cart-store-cart", () => null);
  const isLoading = useState<boolean>("cart-store-loading", () => false);
  const hasLoaded = useState<boolean>("cart-store-has-loaded", () => false);
  const loadError = useState<string | null>("cart-store-load-error", () => null);

  const cartLines = computed<CartLine[]>(() => cart.value?.lines?.nodes ?? []);
  const cartLineByProductId = computed<Record<string, CartLine>>(() => {
    const map: Record<string, CartLine> = {};

    for (const line of cartLines.value) {
      const productId = line.merchandise.product?.id;

      if (productId) {
        map[productId] = line;
      }
    }

    return map;
  });
  const cartCurrencyCode = computed(() => {
    const topLevelCurrencyCode = cart.value?.cost?.totalAmount?.currencyCode;

    if (topLevelCurrencyCode) {
      return topLevelCurrencyCode;
    }

    return cartLines.value[0]?.cost?.totalAmount?.currencyCode ?? "USD";
  });
  const cartCurrencyFormatter = computed(() => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: cartCurrencyCode.value,
  }));

  function setCartFromResponse(response: CurrentCartResponse) {
    cart.value = response.cart;
    hasLoaded.value = true;
  }

  async function fetchCart() {
    isLoading.value = true;
    loadError.value = null;

    try {
      const response = await requestFetch<CurrentCartResponse>("/api/cart/current");
      setCartFromResponse(response);
    }
    catch {
      cart.value = null;
      loadError.value = "We couldn't load your cart.";
      hasLoaded.value = true;
    }
    finally {
      isLoading.value = false;
    }
  }

  async function ensureCartLoaded() {
    if (hasLoaded.value || isLoading.value) {
      return;
    }

    await fetchCart();
  }

  async function addProduct(productId: string) {
    await requestFetch("/api/cart/add", {
      method: "POST",
      body: { productId },
    });

    await fetchCart();
  }

  async function updateLineQuantity(lineId: string, quantity: number) {
    await requestFetch("/api/cart/line/update", {
      method: "POST",
      body: {
        lineId,
        quantity,
      },
    });

    await fetchCart();
  }

  async function removeLine(lineId: string) {
    await requestFetch("/api/cart/line/remove", {
      method: "POST",
      body: {
        lineId,
      },
    });

    await fetchCart();
  }

  function formatLinePrice(line: CartLine): string {
    const amount = Number(line.cost?.totalAmount?.amount ?? 0);
    return cartCurrencyFormatter.value.format(Number.isFinite(amount) ? amount : 0);
  }

  function formatUnitPrice(line: CartLine): string {
    const totalAmount = Number(line.cost?.totalAmount?.amount ?? 0);
    const safeQuantity = line.quantity > 0 ? line.quantity : 1;
    const unitAmount = totalAmount / safeQuantity;
    return cartCurrencyFormatter.value.format(Number.isFinite(unitAmount) ? unitAmount : 0);
  }

  return {
    cart,
    cartLines,
    cartLineByProductId,
    cartCurrencyCode,
    isLoading,
    loadError,
    fetchCart,
    ensureCartLoaded,
    addProduct,
    updateLineQuantity,
    removeLine,
    formatLinePrice,
    formatUnitPrice,
  };
}
