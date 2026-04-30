<template>
  <main class="page-shell mx-auto max-w-2xl py-8">
    <ShellBreadcrumb path="/moments" />

    <section class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight">动态</h1>
      <p class="mt-2 text-sm text-base-content/70">来自所选发布者的短内容更新。</p>

      <div class="mt-5">
        <PublisherSwitcher :publishers="PUBLISHERS" :active="activePub" @change="setPublisher" />
      </div>
    </section>

    <section v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </section>

    <section v-else class="space-y-4">
      <article v-for="post in moments" :key="post.id" class="app-panel overflow-hidden p-4 sm:p-5">
        <div class="mb-2 flex items-center gap-2 text-xs text-base-content/65">
          <span class="badge badge-soft badge-primary badge-sm">{{ post.publisher.name }}</span>
          <span>{{ formatDate(post.publishedAt || post.createdAt) }}</span>
        </div>

        <NuxtLink :to="`/posts/${getPostIdentifier(post)}?pub=${activePub}`" class="block hover:no-underline">
          <h2 v-if="post.title" class="text-base font-bold leading-snug text-base-content/90">
            {{ post.title }}
          </h2>
        </NuxtLink>

        <article
          v-if="renderedMoments[post.id]?.description"
          class="prose-goatshed mt-2 max-w-none text-sm leading-6 text-base-content/80"
          v-html="renderedMoments[post.id].description"
        />

        <article
          v-if="renderedMoments[post.id]?.content"
          class="prose-goatshed mt-2 max-w-none text-sm leading-6 text-base-content/85"
          v-html="renderedMoments[post.id].content"
        />

        <NuxtLink
          v-if="coverImage(post)"
          :to="`/posts/${getPostIdentifier(post)}?pub=${activePub}`"
          class="-mx-5 -mb-5 mt-4 block overflow-hidden border-t border-base-300/40"
        >
          <img :src="coverImage(post)!.src" :alt="coverImage(post)!.alt" class="aspect-video w-full object-cover" loading="lazy">
        </NuxtLink>
      </article>

      <div class="flex justify-center py-3">
        <button v-if="hasMore" class="btn btn-outline btn-sm" :disabled="loadingMore" @click="loadMore">
          <span v-if="loadingMore" class="loading loading-spinner loading-sm" />
          <span v-else>加载更多动态</span>
        </button>
        <p v-else class="text-xs text-base-content/55">没有更多动态了。</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { PUBLISHERS, isPublisherName, type PublisherName } from "~/constants/publishers";
import type { Post, PostListResponse } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const activePub = ref<PublisherName>(
  typeof route.query.pub === "string" && isPublisherName(route.query.pub)
    ? route.query.pub
    : "littlesheep",
);

const moments = ref<Post[]>([]);
const total = ref(0);
const offset = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const renderedMoments = ref<Record<string, { description: string; content: string }>>({});

const hasMore = computed(() => moments.value.length < total.value);

function queryParams(nextOffset: number) {
  return {
    pub: activePub.value,
    type: 0,
    take: 12,
    offset: nextOffset,
  };
}

async function loadInitial() {
  loading.value = true;
  error.value = null;
  offset.value = 0;
  try {
    const result = await $fetch<PostListResponse>("/api/posts", { query: queryParams(0) });
    moments.value = result.posts;
    total.value = result.total;
    offset.value = result.posts.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载动态失败";
    moments.value = [];
    total.value = 0;
    offset.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  error.value = null;
  try {
    const result = await $fetch<PostListResponse>("/api/posts", { query: queryParams(offset.value) });
    moments.value = [...moments.value, ...result.posts];
    total.value = result.total;
    offset.value += result.posts.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载更多动态失败";
  } finally {
    loadingMore.value = false;
  }
}

watch(
  moments,
  async (items) => {
    const next: Record<string, { description: string; content: string }> = {};
    await Promise.all(
      items.map(async (post) => {
        const description = post.description ? await renderMarkdown(withSoftBreaks(post.description)) : "";
        const content = post.content ? await renderMarkdown(withSoftBreaks(post.content)) : "";
        next[post.id] = { description, content };
      }),
    );
    renderedMoments.value = next;
  },
  { immediate: true },
);

function withSoftBreaks(input: string) {
  return input.replace(/\r?\n/g, "  \n");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function coverImage(post: Post) {
  const candidate = post.picture || post.attachments?.[0] || post.background;
  if (!candidate?.id) return null;
  return {
    src: candidate.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(candidate.id)}`,
    alt: post.title || "动态图片",
  };
}

async function setPublisher(next: PublisherName) {
  activePub.value = next;
  await router.replace({ query: { ...route.query, pub: next } });
}

watch(
  () => route.query.pub,
  (value) => {
    if (typeof value === "string" && isPublisherName(value) && value !== activePub.value) {
      activePub.value = value;
    }
  },
);

watch(activePub, async () => {
  await loadInitial();
}, { immediate: true });

useHead({
  title: "动态",
  meta: [
    { name: "description", content: "浏览 littlesheep 的生活动态和日常碎片。" },
    { property: "og:title", content: "动态 - Goatshed" },
    { property: "og:description", content: "浏览 littlesheep 的生活动态和日常碎片。" },
    { property: "og:type", content: "website" },
  ],
});
</script>
