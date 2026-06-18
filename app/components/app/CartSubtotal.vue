<script lang="ts" setup>
defineProps<{
  subtotal: string;
}>();
</script>

<template>
  <div class="mb-3 flex items-center gap-3 text-base">
    <span class="font-medium opacity-70">Subtotal</span>
    <span class="font-semibold">{{ subtotal }}</span>
  </div>
</template>
