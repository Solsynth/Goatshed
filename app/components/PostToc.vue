<template>
  <nav v-if="items.length" class="toc-wrapper">
    <button
      class="toc-header flex w-full items-center justify-between"
      @click="expanded = !expanded"
    >
      <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50">
        目录
      </span>
      <svg
        class="toc-chevron h-4 w-4 text-base-content/50 transition-transform duration-200"
        :class="{ 'rotate-180': expanded }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <ul class="toc-list" :class="{ 'toc-collapsed': !expanded }">
      <li
        v-for="item in items"
        :key="item.id"
        class="toc-item"
        :class="[`toc-level-${item.level}`, { 'toc-active': activeId === item.id }]"
      >
        <a :href="`#${item.id}`" @click.prevent="handleClick(item.id)">
          {{ item.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from "~/utils/toc";

const props = defineProps<{
  items: TocItem[];
}>();

const activeId = ref("");
const expanded = ref(true);

function handleClick(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    activeId.value = id;
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      }
    },
    { rootMargin: "-80px 0px -80% 0px" },
  );

  props.items.forEach((item) => {
    const el = document.getElementById(item.id);
    if (el) observer.observe(el);
  });

  onUnmounted(() => observer.disconnect());
});
</script>

<style scoped>
.toc-wrapper {
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  border: 1px solid color-mix(in srgb, var(--color-base-300) 60%, transparent);
  border-radius: var(--radius-box, 0.9rem);
  background-color: var(--color-base-100);
  padding: 0.75rem 1rem;
}

.toc-header {
  cursor: pointer;
  padding: 0.25rem 0;
}

@media (min-width: 1280px) {
  .toc-header {
    cursor: default;
    pointer-events: none;
  }
}

.toc-chevron {
  display: block;
}

@media (min-width: 1280px) {
  .toc-chevron {
    display: none;
  }
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.75rem;
  border-left: 1px solid color-mix(in srgb, var(--color-base-300) 50%, transparent);
  padding-left: 0.75rem;
  max-height: 500px;
  opacity: 1;
  transition: max-height 0.2s ease, opacity 0.15s ease, margin-top 0.2s ease;
}

.toc-list.toc-collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  overflow: hidden;
}

@media (min-width: 1280px) {
  .toc-list {
    max-height: none;
  }

  .toc-list.toc-collapsed {
    max-height: none;
    opacity: 1;
    margin-top: 0.75rem;
    overflow: visible;
  }
}

.toc-item {
  position: relative;
}

.toc-item a {
  display: block;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
  transition: color 0.15s ease;
}

.toc-item a:hover {
  color: var(--color-primary);
}

.toc-item::before {
  content: "";
  position: absolute;
  left: -0.75rem;
  top: 50%;
  height: 0;
  width: 2px;
  transform: translateY(-50%);
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.toc-item.toc-active::before {
  background-color: var(--color-primary);
}

.toc-item.toc-active a {
  color: var(--color-primary);
  font-weight: 500;
}

.toc-level-3 {
  padding-left: 0.75rem;
}

.toc-level-4 {
  padding-left: 1.25rem;
}
</style>
