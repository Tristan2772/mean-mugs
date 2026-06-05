<script lang="ts" setup>
import type { CartLine, CurrentCartResponse } from "~/lib/types";

const { data, pending, error } = await useFetch<CurrentCartResponse>("/api/cart/current");

const cartLines = computed<CartLine[]>(() => data.value?.cart?.lines?.nodes ?? []);
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
    </div>

    <p v-else class="mt-4 opacity-70">
      Your cart is empty.
    </p>
  </div>
</template>
