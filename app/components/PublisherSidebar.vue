<template>
  <aside class="space-y-4">
    <div class="app-panel overflow-hidden p-4">
      <div
        v-if="publisherBackgroundUrl"
        class="mb-3 h-24 w-full rounded-xl border border-base-300/40 bg-base-200/70 bg-cover bg-center"
        :style="{ backgroundImage: `url(${publisherBackgroundUrl})` }"
      />

      <div v-if="pending" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md" />
      </div>

      <div v-else-if="publisher" class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="avatar">
            <div class="h-12 w-12 rounded-xl bg-primary text-primary-content">
              <img v-if="publisherPictureUrl" :src="publisherPictureUrl" :alt="publisher.name">
              <span v-else class="text-sm font-bold">{{ initials }}</span>
            </div>
          </div>
          <div class="min-w-0">
            <p class="truncate text-lg font-bold">{{ publisher.nick || publisher.name }}</p>
            <p class="truncate text-xs text-base-content/70">@{{ publisher.name }}</p>
          </div>
        </div>

        <p v-if="publisher.bio" class="text-sm leading-6 text-base-content/80">
          {{ publisher.bio }}
        </p>

        <div v-if="publisher.verification?.title" class="badge badge-soft badge-primary">
          {{ publisher.verification.title }}
        </div>

        <div v-if="publisherAttachments.length" class="grid grid-cols-3 gap-2">
          <a
            v-for="file in publisherAttachments"
            :key="file.id"
            :href="file.url"
            target="_blank"
            rel="noreferrer"
            class="block overflow-hidden rounded-lg border border-base-300/40"
          >
            <img :src="file.url" :alt="file.name || 'Publisher attachment'" class="h-16 w-full object-cover" loading="lazy">
          </a>
        </div>
      </div>

      <div v-else-if="error" class="text-sm text-error">加载发布者失败。</div>
    </div>

    <div class="app-panel p-4">
      <h3 class="mb-3 text-sm font-bold uppercase tracking-wide text-base-content/70">置顶文章</h3>
      <div v-if="pinnedPending" class="flex justify-center py-6">
        <span class="loading loading-dots loading-md" />
      </div>
      <ul v-else-if="pinned?.length" class="space-y-2">
        <li v-for="post in pinned" :key="post.id">
          <NuxtLink :to="`/posts/${post.id}`" class="block rounded-md px-2 py-1.5 hover:bg-base-200">
            <p class="line-clamp-1 text-sm font-semibold">{{ post.title || "无标题文章" }}</p>
            <p class="text-xs text-base-content/70">{{ new Date(post.publishedAt || post.createdAt).toLocaleDateString() }}</p>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="text-sm text-base-content/65">暂无置顶文章。</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Publisher } from "~/types/publisher";
import type { Post } from "~/types/post";

const props = defineProps<{
  publisherName: string;
}>();

const config = useRuntimeConfig();

const { data: publishersData, pending, error } = await useFetch<Record<string, Publisher | null>>('/api/publishers');

const publisher = computed(() => publishersData.value?.[props.publisherName] ?? null);

const { data: pinned, pending: pinnedPending } = await useFetch<Post[]>(
  () => `/api/publishers/${props.publisherName}/pinned`,
  {
    default: () => [],
    watch: [() => props.publisherName],
  },
);

const initials = computed(() => {
  const source = publisher.value?.nick || publisher.value?.name || "?";
  return source.slice(0, 2).toUpperCase();
});

const publisherPictureUrl = computed(() => {
  const pic = publisher.value?.picture;
  if (!pic?.id) return null;
  return pic.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`;
});

const publisherBackgroundUrl = computed(() => {
  const bg = publisher.value?.background;
  if (!bg?.id) return null;
  return bg.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
});

const publisherAttachments = computed(() => {
  const files = publisher.value?.attachments || [];
  return files
    .filter((file) => file?.id)
    .slice(0, 6)
    .map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`,
    }));
});
</script>
