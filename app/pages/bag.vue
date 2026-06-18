<script lang="ts" setup>
import type { CartLine } from "~/lib/types";

import { useCartStore } from "~/stores/useCartStore";

const cartStore = useCartStore();
await cartStore.fetchCart();

// Local derived state and action status flags.
const cartLines = cartStore.cartLines;
const pending = cartStore.isLoading;
const error = computed(() => cartStore.loadError.value);
const isStartingCheckout = ref(false);
const activeLineMutationId = ref<string | null>(null);
const checkoutError = ref<string | null>(null);
const lineActionError = ref<string | null>(null);
const lineQuantityDrafts = ref<Record<string, number | null>>({});
const isRefreshingAfterReturn = ref(false);

const isInitialLoad = computed(() => pending.value && !cartLines.value.length);

async function refreshCartState() {
  if (isRefreshingAfterReturn.value) {
    return;
  }

  isRefreshingAfterReturn.value = true;

  try {
    await cartStore.fetchCart();
  }
  finally {
    isRefreshingAfterReturn.value = false;
  }
}

function handlePageShow(event: PageTransitionEvent) {
  if (event.persisted) {
    void refreshCartState();
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    void refreshCartState();
  }
}

onMounted(() => {
  window.addEventListener("pageshow", handlePageShow);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("pageshow", handlePageShow);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

function formatLinePrice(line: CartLine): string {
  return cartStore.formatLinePrice(line);
}

function formatUnitPrice(line: CartLine): string {
  return cartStore.formatUnitPrice(line);
}

// Keep local quantity drafts aligned with current cart lines.
watchEffect(() => {
  const nextDrafts: Record<string, number | null> = {};

  for (const line of cartLines.value) {
    nextDrafts[line.id] = lineQuantityDrafts.value[line.id] ?? line.quantity;
  }

  lineQuantityDrafts.value = nextDrafts;
});

// Track whether a specific line is currently being mutated.
function isLineBusy(lineId: string): boolean {
  return activeLineMutationId.value === lineId;
}

// Read the editable quantity draft for a line.
function getDraftQuantity(lineId: string): number | null {
  return lineQuantityDrafts.value[lineId] ?? null;
}

// Persist user-edited quantity input locally until Update is clicked.
function setDraftQuantity(lineId: string, rawValue: string) {
  if (!rawValue.trim()) {
    lineQuantityDrafts.value[lineId] = null;
    return;
  }

  const parsedQuantity = Number(rawValue);
  lineQuantityDrafts.value[lineId] = Number.isFinite(parsedQuantity) ? parsedQuantity : null;
}

// Determine whether the local draft differs from Shopify's current quantity.
function hasQuantityChanged(line: CartLine): boolean {
  return getDraftQuantity(line.id) !== line.quantity;
}

// Validate draft quantity against server-side constraints.
function isDraftQuantityValid(lineId: string): boolean {
  const quantity = getDraftQuantity(lineId);
  return Number.isInteger(quantity) && Number(quantity) >= 1 && Number(quantity) <= 999;
}

// Update one line's quantity and then refresh canonical cart state.
async function updateLineQuantity(lineId: string, quantity: number) {
  if (isLineBusy(lineId)) {
    return;
  }

  activeLineMutationId.value = lineId;
  lineActionError.value = null;

  try {
    await cartStore.updateLineQuantity(lineId, quantity);
  }
  catch {
    lineActionError.value = "We couldn't update quantity. Please try again.";
  }
  finally {
    activeLineMutationId.value = null;
  }
}

// Commit a line's draft quantity to Shopify only when Update is clicked.
async function saveLineQuantity(line: CartLine) {
  if (isLineBusy(line.id) || !hasQuantityChanged(line) || !isDraftQuantityValid(line.id)) {
    return;
  }

  await updateLineQuantity(line.id, Number(getDraftQuantity(line.id)));
}

// Remove a line completely and then refresh canonical cart state.
async function removeLine(lineId: string) {
  if (isLineBusy(lineId)) {
    return;
  }

  activeLineMutationId.value = lineId;
  lineActionError.value = null;

  try {
    await cartStore.removeLine(lineId);
  }
  catch {
    lineActionError.value = "We couldn't remove that item. Please try again.";
  }
  finally {
    activeLineMutationId.value = null;
  }
}

// Request a fresh checkout URL only when the shopper clicks Checkout.
async function startCheckout() {
  if (isStartingCheckout.value || !cartLines.value.length) {
    return;
  }

  isStartingCheckout.value = true;
  checkoutError.value = null;

  try {
    const response = await $fetch<{ checkoutUrl: string }>("/api/cart/checkout-url");

    if (!response.checkoutUrl) {
      throw new Error("Missing checkout URL");
    }

    await navigateTo(response.checkoutUrl, {
      external: true,
    });
  }
  catch {
    checkoutError.value = "We couldn't start checkout. Please try again.";
  }
  finally {
    isStartingCheckout.value = false;
  }
}
</script>

<template>
  <!-- Page wrapper and heading. -->
  <div class="p-4">
    <h2 class="text-2xl font-semibold">
      your cart
    </h2>

    <div v-if="isRefreshingAfterReturn" class="mt-3 inline-flex items-center gap-2 text-sm text-base-content/70">
      <span class="loading loading-spinner loading-sm" />
      <span>Refreshing your cart...</span>
    </div>

    <!-- Initial data-loading state. -->
    <div v-if="isInitialLoad" class="mt-4 inline-flex items-center gap-2">
      <span class="loading loading-spinner loading-sm" />
      <span>Loading your cart...</span>
    </div>

    <!-- Fetch failure state. -->
    <p v-else-if="error" class="mt-4 text-error">
      We couldn't load your cart.
    </p>

    <!-- Populated cart view with line controls and checkout action. -->
    <div v-else-if="cartLines.length" class="mt-6 space-y-4">
      <!-- Per-line product details and quantity actions. -->
      <AppCartProductCard
        v-for="line in cartLines"
        :key="line.id"
        :line="line"
        :is-busy="isLineBusy(line.id)"
        :draft-quantity="getDraftQuantity(line.id)"
        :has-quantity-changed="hasQuantityChanged(line)"
        :is-draft-quantity-valid="isDraftQuantityValid(line.id)"
        :line-price="formatLinePrice(line)"
        :line-unit-price="formatUnitPrice(line)"
        @remove="removeLine(line.id)"
        @draft-change="setDraftQuantity(line.id, $event)"
        @save-quantity="saveLineQuantity(line)"
      />

      <!-- Checkout action and inline action errors. -->
      <div class="pt-2 flex flex-col items-end">
        <!-- Cart subtotal from Shopify Storefront API -->
        <AppCartSubtotal :subtotal="cartStore.formatSubtotal()" />
        <button class="btn btn-primary gap-2" :disabled="isStartingCheckout || Boolean(activeLineMutationId)" @click="startCheckout">
          <span v-if="isStartingCheckout" class="loading loading-spinner loading-sm" />
          <span>{{ isStartingCheckout ? "Redirecting..." : "Checkout" }}</span>
        </button>
        <p v-if="lineActionError" class="mt-2 text-sm text-error">
          {{ lineActionError }}
        </p>
        <p v-if="checkoutError" class="mt-2 text-sm text-error">
          {{ checkoutError }}
        </p>
      </div>
    </div>

    <!-- Empty cart fallback state. -->
    <p v-else class="mt-4 opacity-70">
      Your cart is empty.
    </p>
  </div>
</template>
