<template>
  <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-base-300/60 bg-base-200/50 px-3.5 py-1.5 text-xs sm:text-sm">
    <span class="relative flex h-2 w-2">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
      <span class="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
    <span class="text-primary">{{ username }}@goatshed</span>
    <span>{{ path }}</span>
    <span class="opacity-40">$</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  path: string;
}>();

const auth = useAuth();

const username = computed(() => {
  const user = auth.user.value;
  return user?.username || user?.name || "guest";
});
</script>
