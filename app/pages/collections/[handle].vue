<script lang="ts" setup>
import type { Product } from "~/lib/types";

import { useGetProductsInCollectionByCollectionHandle } from "~/composables/queries/useGetProductsInCollectionByCollectionHandle";

const route = useRoute();
const handleParam = route.params.handle;
const collectionHandle = Array.isArray(handleParam) ? handleParam[0] : handleParam;

if (!collectionHandle) {
  throw createError({
    statusCode: 404,
    statusMessage: "Collection handle not found",
  });
}

const { data } = await useGetProductsInCollectionByCollectionHandle(collectionHandle);
const products = computed<Product[]>(() => data.value?.collection?.products?.nodes ?? []);
</script>

<template>
  <div>
    <div v-if="data?.collection">
      <AppHalfHero :title="data.collection.title" :description="data.collection.description" />
    </div>

    <div v-if="data?.collection" class="w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
      <!-- -------------------------
       todo: add in pagination
        --------------- -->

      <AppProductCard
        v-for="product in products"
        :key="product.id"
        :product-id="product.id"
        :title="product.title"
        :description="product.description"
        :available="product.availableForSale"
        :price="product.priceRange.minVariantPrice.amount"
        :compare-at-price="product.compareAtPriceRange?.maxVariantPrice.amount"
        :is-active-product="false"
        :images="product.images.nodes"
      />
    </div>
  </div>
</template>
