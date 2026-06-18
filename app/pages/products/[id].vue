<script lang="ts" setup>
import type { ProductImages } from "~/lib/types";

import { useGetProductByHandle } from "~/composables/queries/useGetProductByHandle";
import { useCartStore } from "~/stores/useCartStore";

type ProductVariantImage = ProductImages;

type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  } | null;
  image?: ProductVariantImage | null;
};

type Money = {
  amount: string;
  currencyCode: string;
};

type ProductDetails = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange?: {
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    nodes: ProductImages[];
  };
  variants: {
    nodes: ProductVariant[];
  };
};

const route = useRoute();
const handleParam = route.params.id;
const productHandle = Array.isArray(handleParam) ? handleParam[0] : handleParam;

if (!productHandle) {
  throw createError({
    statusCode: 404,
    statusMessage: "Product not found",
  });
}

const { data } = await useGetProductByHandle(productHandle);
const product = computed<ProductDetails>(() => data.value?.product as ProductDetails);
const selectedVariantId = ref<string>("");
const cartStore = useCartStore();
const isAddingToCart = ref(false);
const isUpdatingQuantity = ref(false);
const quantityDraft = ref<number | null>(null);
const pendingQuantityUpdateTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const variants = computed(() => product.value?.variants?.nodes ?? []);

watchEffect(() => {
  if (!variants.value.length) {
    selectedVariantId.value = "";
    return;
  }

  const fallbackVariant = variants.value[0];

  if (!fallbackVariant) {
    selectedVariantId.value = "";
    return;
  }

  if (!selectedVariantId.value || !variants.value.some(variant => variant.id === selectedVariantId.value)) {
    selectedVariantId.value = variants.value.find(variant => variant.availableForSale)?.id ?? fallbackVariant.id;
  }
});

const selectedVariant = computed<ProductVariant | null>(() => variants.value.find(variant => variant.id === selectedVariantId.value) ?? variants.value[0] ?? null);
const selectedVariantCartLine = computed(() => {
  if (!selectedVariant.value?.id) {
    return null;
  }

  return cartStore.cartLines.value.find(line => line.merchandise.id === selectedVariant.value?.id) ?? null;
});
const quantityInCart = computed(() => selectedVariantCartLine.value?.quantity ?? 0);
const hasSelectedVariantInCart = computed(() => quantityInCart.value > 0);

const displayImage = computed<ProductVariantImage | null>(() => selectedVariant.value?.image ?? product.value?.images.nodes[0] ?? null);

const displayPrice = computed<Money | null>(() => {
  if (selectedVariant.value?.price) {
    return selectedVariant.value.price;
  }

  return product.value
    ? product.value.priceRange.minVariantPrice
    : null;
});

const displayCompareAtPrice = computed<Money | null>(() => selectedVariant.value?.compareAtPrice ?? product.value?.compareAtPriceRange?.maxVariantPrice ?? null);

const selectedOptionsLabel = computed(() => selectedVariant.value?.selectedOptions.map(option => `${option.name}: ${option.value}`).join(" · ") ?? "");
const selectedPieceCountLabel = computed(() => {
  const optionWithPieces = selectedVariant.value?.selectedOptions.find(option => /piece/i.test(option.name) || /piece/i.test(option.value));

  if (optionWithPieces?.value) {
    return optionWithPieces.value;
  }

  const variantTitleMatch = selectedVariant.value?.title.match(/\d+\s*(pieces?|pcs?)/i);
  if (variantTitleMatch) {
    return variantTitleMatch[0];
  }

  return null;
});
const displayProductTitle = computed(() => {
  if (!selectedPieceCountLabel.value) {
    return product.value.title;
  }

  if (new RegExp(selectedPieceCountLabel.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(product.value.title)) {
    return product.value.title;
  }

  return `${product.value.title} - ${selectedPieceCountLabel.value}`;
});

const displayDescription = computed(() => {
  const rawDescription = product.value?.description ?? "";

  const withBulletBreaks = rawDescription
    // Normalize escaped/newline variants first.
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    // Add a line break before bullet markers when they appear inline.
    .replace(/([^\n])\s*([•*-])\s+/g, "$1\n$2 ")
    .trim();

  // Add two blank lines before the first bullet in the block.
  return withBulletBreaks.replace(/(\n?)([•*-]\s+)/, "\n\n$2");
});

const canAddSelectedVariant = computed(() => Boolean(selectedVariant.value?.id) && Boolean(selectedVariant.value?.availableForSale));

watch(quantityInCart, (nextQuantity) => {
  quantityDraft.value = nextQuantity || 1;
}, { immediate: true });

function formatMoney(amount: string, currencyCode: string) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount)) {
    return amount;
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(parsedAmount);
}

function clearPendingQuantityUpdate() {
  if (pendingQuantityUpdateTimeout.value) {
    clearTimeout(pendingQuantityUpdateTimeout.value);
    pendingQuantityUpdateTimeout.value = null;
  }
}

function isDraftQuantityValid(): boolean {
  return Number.isInteger(quantityDraft.value) && Number(quantityDraft.value) >= 1 && Number(quantityDraft.value) <= 999;
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
    void updateSelectedVariantQuantity();
  }, 400);
}

async function updateSelectedVariantQuantity() {
  clearPendingQuantityUpdate();

  if (!selectedVariantCartLine.value || !hasSelectedVariantInCart.value) {
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
    await cartStore.updateLineQuantity(selectedVariantCartLine.value.id, nextQuantity);
  }
  finally {
    isUpdatingQuantity.value = false;
  }
}

onMounted(() => {
  void cartStore.ensureCartLoaded();
});

async function addSelectedVariantToCart() {
  if (!selectedVariant.value?.id || !canAddSelectedVariant.value || isAddingToCart.value) {
    return;
  }

  isAddingToCart.value = true;

  try {
    await cartStore.addVariant(selectedVariant.value.id);
  }
  finally {
    isAddingToCart.value = false;
  }
}

onBeforeUnmount(() => {
  clearPendingQuantityUpdate();
});

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Product not found",
  });
}
</script>

<template>
  <div class="mx-auto max-w-6xl p-4 md:p-8">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
      <section class="rounded-3xl bg-base-200/80 p-4 shadow-xl shadow-black/10 ring-1 ring-base-300/60 md:p-6 lg:sticky lg:top-4 lg:self-start">
        <div class="overflow-hidden rounded-2xl bg-base-100">
          <img
            v-if="displayImage?.url"
            class="aspect-square w-full object-cover"
            :src="displayImage.url"
            :alt="displayImage.altText || product.title"
          >
          <div v-else class="flex aspect-square items-center justify-center text-base-content/60">
            Image unavailable
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-6 rounded-3xl bg-base-100 p-5 shadow-xl shadow-black/10 ring-1 ring-base-300/60 md:p-8">
        <div class="space-y-3">
          <div class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Product Details
          </div>
          <h1 class="text-3xl font-black leading-tight md:text-5xl">
            {{ displayProductTitle }}
          </h1>
          <p class="max-w-2xl whitespace-pre-line text-sm leading-6 text-base-content/75 md:text-base">
            {{ displayDescription }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded-full px-3 py-1 text-sm font-semibold"
            :class="selectedVariant?.availableForSale ? 'bg-success/15 text-success' : 'bg-error/15 text-error'"
          >
            {{ selectedVariant?.availableForSale ? 'In stock' : 'Sold out' }}
          </span>
          <span v-if="selectedOptionsLabel" class="rounded-full bg-base-200 px-3 py-1 text-sm text-base-content/70">
            {{ selectedOptionsLabel }}
          </span>
        </div>

        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex items-end gap-3">
            <p class="text-4xl font-black tracking-tight md:text-5xl">
              {{ displayPrice ? formatMoney(displayPrice.amount, displayPrice.currencyCode) : '' }}
            </p>
            <p v-if="displayCompareAtPrice && Number(displayCompareAtPrice) && displayPrice && displayCompareAtPrice.amount !== displayPrice.amount" class="pb-1 text-lg text-base-content/50 line-through">
              {{ formatMoney(displayCompareAtPrice.amount, displayCompareAtPrice.currencyCode) }}
            </p>
          </div>

          <div v-if="hasSelectedVariantInCart" class="flex items-center gap-2 text-sm text-base-content/70">
            <span class="font-medium">In your bag:</span>
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              class="h-10 w-24 rounded-md border px-2 text-base-content transition-colors duration-150 focus:outline-none disabled:opacity-60"
              :class="quantityDraft !== quantityInCart ? 'border-base-300 bg-base-100' : 'border-transparent bg-base-200/70 hover:border-base-300 hover:bg-base-100 focus:border-base-300 focus:bg-base-100'"
              :disabled="isAddingToCart || isUpdatingQuantity"
              :value="quantityDraft ?? ''"
              @input="setQuantityDraft(($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            >
            <span v-if="isUpdatingQuantity" class="loading loading-spinner loading-sm" />
          </div>

          <button
            v-else
            class="btn btn-primary"
            :disabled="!canAddSelectedVariant || isAddingToCart"
            @click="addSelectedVariantToCart"
          >
            <span v-if="isAddingToCart" class="loading loading-spinner loading-sm" />
            <Icon v-else name="tabler:shopping-bag-plus" size="20" />
            {{ canAddSelectedVariant ? 'Add to Bag' : 'Sold out' }}
          </button>
        </div>

        <div v-if="variants.length" class="space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/60">
            Choose a variant
          </h2>
          <div class="grid gap-3">
            <label
              v-for="variant in variants"
              :key="variant.id"
              class="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors"
              :class="selectedVariantId === variant.id ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/40 hover:border-base-content/20'"
            >
              <input
                v-model="selectedVariantId"
                type="radio"
                class="radio radio-primary mt-1"
                name="product-variant"
                :value="variant.id"
              >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-semibold">
                    {{ variant.title }}
                  </span>
                  <span class="text-sm font-semibold">
                    {{ formatMoney(variant.price.amount, variant.price.currencyCode) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-base-content/60">
                  <span v-for="(option, index) in variant.selectedOptions" :key="`${variant.id}-${option.name}`">
                    {{ option.name }}: {{ option.value }}<span v-if="index < variant.selectedOptions.length - 1"> · </span>
                  </span>
                </p>
              </div>
            </label>
          </div>
        </div>

        <div class="rounded-2xl bg-base-200/80 p-4 text-sm text-base-content/75">
          <p class="font-semibold text-base-content">
            What changes when you switch variants
          </p>
          <p class="mt-1">
            The image, selected details, availability, and price all update from the variant you choose.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
