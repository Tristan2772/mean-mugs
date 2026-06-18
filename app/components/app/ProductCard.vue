<script lang="ts" setup>
import type { ProductImages } from "~/lib/types";

type ProductCardProps = {
  title: string;
  description: string;
  available: boolean;
  price: string;
  compareAtPrice?: string;
  productId: string;
  handle: string;
  images?: ProductImages[];
};

const props = withDefaults(defineProps<ProductCardProps>(), {
  images: () => [],
});
</script>

<template>
  <NuxtLink :to="`/products/${props.handle}`" class="card card-sm shadow-sm bg-base-300">
    <figure v-if="props.images[0]?.url">
      <img
        class="w-full aspect-square"
        :src="props.images[0]?.url ?? ''"
        :alt="props.images[0].altText || props.title"
      >
    </figure>
    <div class="card-body">
      <h3 class="card-title text-lg">
        {{ props.title }}
      </h3>
      <p class="min-h-8 line-clamp-2">
        {{ props.description }}
      </p>
      <div class="flex justify-between">
        <div class="flex items-center gap-1">
          <p v-if="Number(props.compareAtPrice)" class="line-through text-xs">
            {{ props.compareAtPrice }}
          </p>
          <p class="text-sm">
            {{ props.price }}
          </p>
        </div>
        <p class="text-xs text-right uppercase tracking-wide text-base-content/50">
          View details
        </p>
      </div>
    </div>
  </NuxtLink>
</template>
