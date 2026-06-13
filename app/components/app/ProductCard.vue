<script lang="ts" setup>
import type { ProductImages } from "~/lib/types";

import { useCartStore } from "~/stores/useCartStore";

type ProductCardProps = {
  title: string;
  description: string;
  available: boolean;
  price: string;
  compareAtPrice?: string;
  productId: string;
  images?: ProductImages[];
};

const props = withDefaults(defineProps<ProductCardProps>(), {
  images: () => [],
});

const cartStore = useCartStore();
const isAddingToCart = ref(false);
const isUpdatingQuantity = ref(false);
const quantityDraft = ref<number | null>(null);
const pendingQuantityUpdateTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const matchingCartLine = computed(() => cartStore.cartLineByProductId.value[props.productId]);
const quantityInCart = computed(() => matchingCartLine.value?.quantity ?? 0);
const hasItemInCart = computed(() => quantityInCart.value > 0);

watch(quantityInCart, (nextQuantity) => {
  quantityDraft.value = nextQuantity || 1;
}, { immediate: true });

function clearPendingQuantityUpdate() {
  if (pendingQuantityUpdateTimeout.value) {
    clearTimeout(pendingQuantityUpdateTimeout.value);
    pendingQuantityUpdateTimeout.value = null;
  }
}

function setQuantityDraft(rawValue: string) {
  clearPendingQuantityUpdate();

  if (!rawValue.trim()) {
    quantityDraft.value = null;
    return;
  }

  const parsedQuantity = Number(rawValue);
  quantityDraft.value = Number.isFinite(parsedQuantity) ? parsedQuantity : null;

  pendingQuantityUpdateTimeout.value = setTimeout(() => {
    pendingQuantityUpdateTimeout.value = null;
    void updateCartLineQuantity();
  }, 500);
}

function isDraftQuantityValid(): boolean {
  return Number.isInteger(quantityDraft.value) && Number(quantityDraft.value) >= 1 && Number(quantityDraft.value) <= 999;
}

onMounted(() => {
  void cartStore.ensureCartLoaded();
});

async function addProductToCartByProductId(productId: string) {
  if (isAddingToCart.value || isUpdatingQuantity.value) {
    return;
  }

  isAddingToCart.value = true;

  try {
    await cartStore.addProduct(productId);
  }
  finally {
    isAddingToCart.value = false;
  }
}

async function updateCartLineQuantity() {
  clearPendingQuantityUpdate();

  if (!matchingCartLine.value) {
    return;
  }

  if (!isDraftQuantityValid()) {
    quantityDraft.value = quantityInCart.value || 1;
    return;
  }

  const nextQuantity = Number(quantityDraft.value);

  if (nextQuantity === quantityInCart.value || isUpdatingQuantity.value || isAddingToCart.value) {
    return;
  }

  isUpdatingQuantity.value = true;

  try {
    await cartStore.updateLineQuantity(matchingCartLine.value.id, nextQuantity);
  }
  finally {
    isUpdatingQuantity.value = false;
  }
}

onBeforeUnmount(() => {
  clearPendingQuantityUpdate();
});
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
          <button
            v-if="!hasItemInCart"
            class="btn btn-primary"
            :disabled="isAddingToCart || isUpdatingQuantity"
            @click="addProductToCartByProductId(props.productId)"
          >
            <Icon name="tabler:shopping-bag-plus" size="24" />
            Add to Bag
          </button>
          <label v-else class="flex items-center gap-2 text-sm text-base-content/70">
            Qty:
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              class="h-8 w-24 rounded-md border px-2 text-base-content transition-colors duration-150 focus:outline-none disabled:opacity-60"
              :class="quantityDraft !== quantityInCart ? 'border-base-300 bg-base-100' : 'border-transparent bg-transparent hover:border-base-300 hover:bg-base-100 focus:border-base-300 focus:bg-base-100'"
              :disabled="isAddingToCart || isUpdatingQuantity"
              :value="quantityDraft ?? ''"
              @input="setQuantityDraft(($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            >
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
