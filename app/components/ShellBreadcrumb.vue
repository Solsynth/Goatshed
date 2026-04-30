<template>
  <div
    class="breadcrumb-shell mb-3 inline-flex flex-col items-start gap-0.5 rounded-lg border border-base-300/60 bg-base-200/50 px-3.5 py-1.5 text-xs sm:rounded-full sm:flex-row sm:items-center sm:gap-2 sm:text-sm"
  >
    <div class="flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
        />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span class="text-primary">{{ username }}@goatshed</span>
    </div>
    <div class="flex items-center">
      <span class="sm:hidden opacity-40 me-2">$</span>
      <span class="hidden sm:inline opacity-40 mx-px">/</span>
      <template v-for="(segment, index) in displaySegments" :key="index">
        <NuxtLink
          v-if="segment.path && !props.noLink"
          :to="segment.path"
          class="hover:text-primary hover:underline"
        >
          {{ segment.label }}
        </NuxtLink>
        <span v-else>{{ segment.label }}</span>
        <span
          v-if="index < displaySegments.length - 1"
          class="opacity-40 mx-px"
        >
          /
        </span>
      </template>
      <span class="hidden sm:inline opacity-40 ml-2">$</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  path: string;
  noLink?: boolean;
}>();

const auth = useAuth();

const username = computed(() => {
  const user = auth.user.value;
  return user?.username || user?.name || "guest";
});

const pathSegments = computed(() => {
  const parts = props.path.split("/").filter(Boolean);
  const segments: { label: string; path: string | null }[] = [];

  parts.forEach((part, index) => {
    segments.push({
      label: part,
      path:
        index < parts.length - 1
          ? "/" + parts.slice(0, index + 1).join("/")
          : null,
    });
  });

  return segments;
});

const displaySegments = computed(() => {
  const segments = pathSegments.value;
  if (segments.length <= 3) return segments;

  return segments.map((seg, index) => {
    if (index < segments.length - 1) {
      return {
        label: seg.label.charAt(0),
        path: seg.path,
      };
    }
    return seg;
  });
});
</script>

<style scoped>
.breadcrumb-shell {
  view-transition-name: breadcrumb;
}
</style>
