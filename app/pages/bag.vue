<script lang="ts" setup>
import type { CartLine, CurrentCartResponse } from "~/lib/types";

// Load current cart state from the secure server endpoint.
const { data, pending, error, refresh } = await useFetch<CurrentCartResponse>("/api/cart/current");

// Local derived state and action status flags.
const cartLines = computed<CartLine[]>(() => data.value?.cart?.lines?.nodes ?? []);
const isStartingCheckout = ref(false);
const activeLineMutationId = ref<string | null>(null);
const checkoutError = ref<string | null>(null);
const lineActionError = ref<string | null>(null);
const lineQuantityDrafts = ref<Record<string, number | null>>({});

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
    await $fetch("/api/cart/line/update", {
      method: "POST",
      body: {
        lineId,
        quantity,
      },
    });

    await refresh();
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
    await $fetch("/api/cart/line/remove", {
      method: "POST",
      body: {
        lineId,
      },
    });

    await refresh();
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

    <!-- Initial data-loading state. -->
    <p v-if="pending" class="mt-4">
      Loading your cart...
    </p>

    <!-- Fetch failure state. -->
    <p v-else-if="error" class="mt-4 text-error">
      We couldn't load your cart.
    </p>

    <!-- Populated cart view with line controls and checkout action. -->
    <div v-else-if="cartLines.length" class="mt-6 space-y-4">
      <!-- Per-line product details and quantity actions. -->
      <div
        v-for="line in cartLines"
        :key="line.id"
        class="flex items-center gap-4 rounded-lg bg-base-200 p-4"
      >
        <button
          class="h-20 w-10 shrink-0 text-6xl leading-none font-thin text-base-content/30 transition-colors hover:text-error"
          :disabled="isLineBusy(line.id)"
          aria-label="Remove item"
          @click="removeLine(line.id)"
        >
          <span v-if="isLineBusy(line.id)" class="loading loading-spinner loading-xs" />
          <span v-else>&times;</span>
        </button>
        <img
          v-if="line.merchandise.product?.images.nodes[0]?.url"
          class="h-20 w-20 rounded-md object-cover"
          :src="line.merchandise.product.images.nodes[0]?.url ?? ''"
          :alt="line.merchandise.product.images.nodes[0]?.altText || line.merchandise.product.title"
        >
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-medium">
            {{ line.merchandise.product?.title ?? line.merchandise.title }}
          </h3>
          <div class="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              class="input input-bordered input-sm w-24"
              :disabled="isLineBusy(line.id)"
              :value="getDraftQuantity(line.id) ?? ''"
              @input="setDraftQuantity(line.id, ($event.target as HTMLInputElement).value)"
            >
            <button
              v-if="hasQuantityChanged(line)"
              class="btn btn-xs"
              :disabled="isLineBusy(line.id) || !isDraftQuantityValid(line.id)"
              @click="saveLineQuantity(line)"
            >
              <span v-if="isLineBusy(line.id)" class="loading loading-spinner loading-xs" />
              <span v-else>Update</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Checkout action and inline action errors. -->
      <div class="pt-2 flex flex-col items-end">
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
