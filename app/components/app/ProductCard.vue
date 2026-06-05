<script lang="ts" setup>
import type { ProductImages } from "~/lib/types";

type ProductCardProps = {
  title: string;
  description: string;
  available: boolean;
  price: string;
  compareAtPrice: string;
  productId: string;
  images?: ProductImages[];
};

const props = withDefaults(defineProps<ProductCardProps>(), {
  images: () => [],
});

const isAddingToCart = ref(false);

async function addProductToCartByProductId(productId: string) {
  if (isAddingToCart.value) {
    return;
  }

  isAddingToCart.value = true;

  try {
    await $fetch("/api/cart/add", {
      method: "POST",
      body: { productId },
    });
  }
  finally {
    isAddingToCart.value = false;
  }
}
</script>

<template>
  <div class="card card-sm shadow-sm bg-base-300">
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
          <p class="line-through text-xs">
            {{ props.compareAtPrice }}
          </p>
          <p class="text-sm">
            {{ props.price }}
          </p>
        </div>
        <div class="card-actions justify-end">
          <button class="btn btn-primary" :disabled="isAddingToCart" @click="addProductToCartByProductId(props.productId)">
            <Icon name="tabler:shopping-bag-plus" size="24" />
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
