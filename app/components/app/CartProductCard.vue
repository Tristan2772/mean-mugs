<script lang="ts" setup>
import type { CartLine } from "~/lib/types";

type CartProductCardProps = {
  line: CartLine;
  isBusy: boolean;
  draftQuantity: number | null;
  hasQuantityChanged: boolean;
  isDraftQuantityValid: boolean;
  linePrice: string;
  lineUnitPrice: string;
};

const props = defineProps<CartProductCardProps>();

const emit = defineEmits<{
  remove: [];
  draftChange: [rawValue: string];
  saveQuantity: [];
}>();
</script>

<template>
  <div class="flex items-center gap-4 rounded-lg bg-base-200 p-4">
    <button
      class="btn btn-square btn-ghost shrink-0 leading-none font-thin text-base-content/30 transition-colors hover:text-error"
      :disabled="props.isBusy"
      aria-label="Remove item"
      @click="emit('remove')"
    >
      <span v-if="props.isBusy" class="loading loading-spinner loading-xs" />
      <Icon v-else-if="!props.isBusy" name="tabler:x" size="40" />
    </button>

    <img
      v-if="props.line.merchandise.product?.images.nodes[0]?.url"
      class="h-20 w-20 rounded-md object-cover"
      :src="props.line.merchandise.product.images.nodes[0]?.url ?? ''"
      :alt="props.line.merchandise.product.images.nodes[0]?.altText || props.line.merchandise.product.title"
    >

    <div class="min-w-0 flex-1">
      <h3 class="truncate text-lg font-medium">
        {{ props.line.merchandise.product?.title ?? props.line.merchandise.title }}
      </h3>

      <div class="mt-2 flex justify-between">
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-sm text-base-content/70">
            Qty:
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              class="h-8 w-24 rounded-md border px-2 text-base-content transition-colors duration-150 focus:outline-none disabled:opacity-60"
              :class="props.hasQuantityChanged ? 'border-base-300 bg-base-100' : 'border-transparent bg-transparent hover:border-base-300 hover:bg-base-100 focus:border-base-300 focus:bg-base-100' "
              :disabled="props.isBusy"
              :value="props.draftQuantity ?? ''"
              @input="emit('draftChange', ($event.target as HTMLInputElement).value)"
            >
            @ {{ props.lineUnitPrice }} /each
          </label>

          <button
            v-if="props.hasQuantityChanged"
            class="btn btn-xs"
            :disabled="props.isBusy || !props.isDraftQuantityValid"
            @click="emit('saveQuantity')"
          >
            <span v-if="props.isBusy" class="loading loading-spinner loading-xs" />
            <span v-else>Update</span>
          </button>
        </div>
        <div class="text-sm flex items-center mr-4">
          {{ props.linePrice }}
        </div>
      </div>
    </div>
  </div>
</template>
