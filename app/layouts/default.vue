<script lang="ts" setup>
import { useWindowScroll } from "@vueuse/core";

const isNavbarVisible = ref(true);
const { y } = useWindowScroll();
const previousY = ref(0);
const scrollThreshold = 30;

watch(y, (newY) => {
  const changeInY = newY - previousY.value;

  if (changeInY < -scrollThreshold) {
    // Scrolled up past threshold — show navbar
    isNavbarVisible.value = true;
    previousY.value = newY;
  }
  else if (changeInY > scrollThreshold) {
    // Scrolled down past threshold — hide navbar
    isNavbarVisible.value = false;
    previousY.value = newY;
  }

  // Always show navbar near the top of the page
  if (newY <= 10) {
    isNavbarVisible.value = true;
  }
});
</script>

<template>
  <div>
    <Transition name="nav-top-fade">
      <AppNavBar v-show="isNavbarVisible" />
    </Transition>
    <div class="pt-19">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.nav-top-fade-enter-active {
  transition: all 0.15s ease-out;
}

.nav-top-fade-leave-active {
  transition: all 0.25s ease-out;
}

.nav-top-fade-enter-from,
.nav-top-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
