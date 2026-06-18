<script lang="ts" setup>
const isMobileNavOpen = ref(false);
const mobileNavRef = ref<HTMLElement | null>(null);

onClickOutside(mobileNavRef, () => {
  isMobileNavOpen.value = false;
});

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value;
}
</script>

<template>
  <div class="navbar bg-base-100 shadow-sm fixed mt-2 inset-x-2 w-auto rounded-2xl z-10">
    <div class="navbar-start">
      <div ref="mobileNavRef">
        <button
          class="btn btn-ghost lg:hidden"
          @click="toggleMobileNav"
        >
          <Transition name="nav-icon-menu">
            <Icon
              v-show="!isMobileNavOpen"
              class="absolute"
              name="tabler:menu-3"
              size="24px"
            />
          </Transition>
          <Transition name="nav-icon-x">
            <Icon
              v-show="isMobileNavOpen"
              class="absolute"
              name="tabler:x"
              size="24px"
            />
          </Transition>
        </button>
        <AppNavBarResponsiveMenu :is-mobile-menu="true" :is-open="isMobileNavOpen" />
      </div>
      <NuxtLink to="/" class="text-xl btn btn-ghost w-36 ml-4 flex items-center justify-center">
        <AppPuzzledLogo />
      </NuxtLink>
    </div>
    <div class="navbar-center hidden lg:flex">
      <AppNavBarResponsiveMenu :is-mobile-menu="false" />
    </div>
    <div class="navbar-end">
      <NuxtLink to="/bag" class="btn">
        <Icon name="tabler:shopping-bag" size="24px" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.nav-icon-x-enter-active,
.nav-icon-menu-enter-active {
  transition: all 0.1s ease-out 0.15s;
}
.nav-icon-x-leave-active,
.nav-icon-menu-leave-active {
  transition:
    rotate 0.15s ease-out,
    opacity 0.1s ease-out 0.15s;
}
.nav-icon-x-enter-from,
.nav-icon-menu-enter-from {
  opacity: 0;
}
.nav-icon-x-leave-to,
.nav-icon-menu-leave-to {
  rotate: 45deg;
  opacity: 0;
}
</style>
