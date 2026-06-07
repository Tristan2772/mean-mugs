<script lang="ts" setup>
import type { CartLine, CurrentCartResponse } from "~/lib/types";

const { data, pending, error } = await useFetch<CurrentCartResponse>("/api/cart/current");

const cartLines = computed<CartLine[]>(() => data.value?.cart?.lines?.nodes ?? []);
const isStartingCheckout = ref(false);
const checkoutError = ref<string | null>(null);

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
  <div class="p-4">
    <h2 class="text-2xl font-semibold">
      your cart
    </h2>

    <p v-if="pending" class="mt-4">
      Loading your cart...
    </p>

    <p v-else-if="error" class="mt-4 text-error">
      We couldn't load your cart.
    </p>

    <div v-else-if="cartLines.length" class="mt-6 space-y-4">
      <div
        v-for="line in cartLines"
        :key="line.id"
        class="flex items-center gap-4 rounded-lg bg-base-200 p-4"
      >
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
          <p class="text-sm opacity-70">
            Quantity: {{ line.quantity }}
          </p>
        </div>
      </div>

      <div class="pt-2">
        <button class="btn btn-primary gap-2" :disabled="isStartingCheckout" @click="startCheckout">
          <span v-if="isStartingCheckout" class="loading loading-spinner loading-sm" />
          <span>{{ isStartingCheckout ? "Redirecting..." : "Checkout" }}</span>
        </button>
        <p v-if="checkoutError" class="mt-2 text-sm text-error">
          {{ checkoutError }}
        </p>
      </div>
    </div>

    <p v-else class="mt-4 opacity-70">
      Your cart is empty.
    </p>
  </div>
</template>
