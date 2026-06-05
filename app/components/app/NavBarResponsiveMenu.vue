<script lang="ts" setup>
import jsonData from "../../assets/jsonData/navLinks.json";

defineProps({
  isMobileMenu: Boolean!,
  isOpen: Boolean,
});
const { navLinks, navDropdowns } = jsonData;

const detailRefs = ref<HTMLDetailsElement[]>([]);
onMounted(() => {
  detailRefs.value.forEach((el) => {
    onClickOutside(el, () => {
      el.open = false;
    });
  });
});
</script>

<template>
  <Transition name="mobile-nav-top-fade">
    <ul
      v-show="isOpen || !isMobileMenu"
      class="menu"
      :class="isMobileMenu ? 'mobile-list z-1' : 'menu-horizontal px-1'"
      :tabindex="isMobileMenu ? -1 : undefined "
    >
      <li v-for="(navLink, index) in navLinks" :key="index">
        <NuxtLink :to="navLink.linkPath">
          {{ navLink.linkLabel }}
        </NuxtLink>
      </li>
      <li v-for="(navDropdown, index) in navDropdowns" :key="index">
        <details ref="detailRefs">
          <summary>
            {{ navDropdown.dropdownLabel }}
          </summary>
          <ul class="p-2" :class="isMobileMenu ? '' : 'top-10 bg-base-100 min-w-40 z-10'">
            <li v-for="(dropdownItem, itemIndex) in navDropdown.dropdownItems" :key="itemIndex">
              <NuxtLink :to="dropdownItem.linkPath">
                {{ dropdownItem.linkLabel }}
              </NuxtLink>
            </li>
          </ul>
        </details>
      </li>
    </ul>
  </Transition>
</template>

<style scoped>
.mobile-nav-top-fade-enter-active {
  transition: all 0.15s ease-out;
}

.mobile-nav-top-fade-leave-active {
  transition: all 0.15s ease-out;
}

.mobile-nav-top-fade-enter-from,
.mobile-nav-top-fade-leave-to {
  opacity: 0;
  translate: 0 -10px;
}
</style>
