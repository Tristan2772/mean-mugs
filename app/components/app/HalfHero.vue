<script lang="ts" setup>
const props = defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="min-h-52 w-full flex flex-col items-center justify-center g-2 bg-amber-300">
    <h2 class="text-xl">
      {{ props.title }}
    </h2>
    <p>{{ props.description }}</p>
  </div>
</template>
