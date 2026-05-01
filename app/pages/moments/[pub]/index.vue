<template>
  <main class="moments-page min-w-0 py-8">
    <ShellBreadcrumb :path="`/moments/${activePub}`" />

    <section class="mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">动态</h1>
      <p class="mt-2 text-sm text-base-content/70">
        来自所选发布者的短内容更新。
      </p>

      <div class="mt-5 max-w-xl">
        <PublisherSwitcher
          :publishers="PUBLISHERS"
          :active="activePub"
          @change="setPublisher"
        />
      </div>
    </section>

    <section v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </section>

    <section v-else class="grid min-w-0 gap-6 lg:grid-cols-[1fr_19rem]">
      <div class="min-w-0">
        <MasonryWall
          :items="galleryItems"
          :column-width="280"
          :gap="16"
          :ssr-columns="3"
          :key-mapper="(item) => item.key"
        >
          <template #default="{ item }">
            <NuxtLink
              :to="getMomentPostUrl(item.post)"
              class="masonry-card group"
            >
              <div v-if="!item.textOnly" class="masonry-img-wrap">
                <img
                  :src="item.src"
                  :alt="item.alt"
                  class="masonry-img"
                  :style="{
                    ...(item.isFirst ? { viewTransitionName: `moment-img-${item.post.id}` } : {}),
                    ...(item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : {}),
                  }"
                  loading="lazy"
                >
                <div v-if="item.totalImages > 1 && item.imageIndex === 0" class="masonry-count">
                  {{ item.totalImages }}
                </div>
                <div class="masonry-overlay">
                  <div class="masonry-overlay-content">
                    <div class="flex items-center gap-1.5">
                      <img
                        v-if="getPublisherPicture(item.post)"
                        :src="getPublisherPicture(item.post)"
                        :alt="item.post.publisher.name"
                        class="h-4 w-4 rounded-full object-cover ring-1 ring-white/20"
                        loading="lazy"
                      >
                      <span class="text-xs font-medium text-white/90">
                        {{ item.post.publisher.nick || item.post.publisher.name }}
                      </span>
                    </div>
                    <h3
                      v-if="item.post.title"
                      class="mt-1.5 text-sm font-bold leading-snug text-white line-clamp-2"
                    >
                      {{ item.post.title }}
                    </h3>
                    <p
                      v-else-if="renderedMoments[item.post.id]?.description"
                      class="mt-1.5 text-xs leading-relaxed text-white/80 line-clamp-2"
                      v-html="renderedMoments[item.post.id].description"
                    />
                  </div>
                </div>
              </div>

              <div v-else class="masonry-text-card">
                <div class="flex items-center gap-1.5 mb-2">
                  <img
                    v-if="getPublisherPicture(item.post)"
                    :src="getPublisherPicture(item.post)"
                    :alt="item.post.publisher.name"
                    class="h-4 w-4 rounded-full object-cover"
                    loading="lazy"
                  >
                  <span class="text-xs text-base-content/60">
                    {{ item.post.publisher.nick || item.post.publisher.name }}
                  </span>
                </div>
                <h3
                  v-if="item.post.title"
                  class="text-sm font-bold leading-snug text-base-content/90 line-clamp-2"
                >
                  {{ item.post.title }}
                </h3>
                <article
                  v-if="renderedMoments[item.post.id]?.description"
                  class="prose-goatshed mt-1.5 max-w-none text-xs leading-relaxed text-base-content/70 line-clamp-4"
                  v-html="renderedMoments[item.post.id].description"
                />
                <article
                  v-else-if="renderedMoments[item.post.id]?.content"
                  class="prose-goatshed mt-1.5 max-w-none text-xs leading-relaxed text-base-content/70 line-clamp-4"
                  v-html="renderedMoments[item.post.id].content"
                />
                <span class="mt-2 text-[10px] text-base-content/40">
                  {{ formatDate(item.post.publishedAt || item.post.createdAt) }}
                </span>
              </div>
            </NuxtLink>
          </template>
        </MasonryWall>

        <div class="flex justify-center py-6">
          <button
            v-if="hasMore"
            class="btn btn-outline btn-sm"
            :disabled="loadingMore"
            @click="loadMore"
          >
            <span
              v-if="loadingMore"
              class="loading loading-spinner loading-sm"
            />
            <span v-else>加载更多动态</span>
          </button>
          <p v-else class="text-xs text-base-content/55">没有更多动态了。</p>
        </div>
      </div>

      <PublisherSidebar
        :publisher-name="activePub"
        class="h-fit min-w-0 lg:sticky lg:top-24"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { MasonryWall } from "@yeger/vue-masonry-wall";
import {
  PUBLISHERS,
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post, PostListResponse } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const activePub = computed<PublisherName>(() => {
  const value = route.params.pub;
  return typeof value === "string" && isPublisherName(value)
    ? value
    : "littlesheep";
});

const moments = ref<Post[]>([]);
const total = ref(0);
const offset = ref(0);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const renderedMoments = ref<
  Record<string, { description: string; content: string }>
>({});

const hasMore = computed(() => moments.value.length < total.value);

function postImages(post: Post) {
  const images: { src: string; alt: string; width?: number; height?: number }[] = [];

  if (post.picture?.id) {
    images.push({
      src:
        post.picture.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.picture.id)}`,
      alt: post.title || "动态图片",
      width: post.picture.width ?? undefined,
      height: post.picture.height ?? undefined,
    });
  }

  if (post.attachments?.length) {
    for (const att of post.attachments) {
      if (att.id && att.mimeType?.startsWith("image/")) {
        images.push({
          src:
            att.url ||
            `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(att.id)}`,
          alt: att.name || post.title || "动态图片",
          width: att.width ?? undefined,
          height: att.height ?? undefined,
        });
      }
    }
  }

  if (images.length === 0 && post.background?.id) {
    images.push({
      src:
        post.background.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.background.id)}`,
      alt: post.title || "动态图片",
      width: post.background.width ?? undefined,
      height: post.background.height ?? undefined,
    });
  }

  return images;
}

interface GalleryItem {
  key: string;
  post: Post;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  imageIndex: number;
  totalImages: number;
  isFirst: boolean;
  textOnly: boolean;
}

const galleryItems = computed<GalleryItem[]>(() => {
  const items: GalleryItem[] = [];
  for (const post of moments.value) {
    const images = postImages(post);
    if (images.length === 0) {
      items.push({
        key: `post-${post.id}-text`,
        post,
        src: "",
        alt: "",
        imageIndex: 0,
        totalImages: 0,
        isFirst: true,
        textOnly: true,
      });
    } else {
      for (let i = 0; i < images.length; i++) {
        items.push({
          key: `post-${post.id}-img-${i}`,
          post,
          src: images[i].src,
          alt: images[i].alt,
          width: images[i].width,
          height: images[i].height,
          imageIndex: i,
          totalImages: images.length,
          isFirst: i === 0,
          textOnly: false,
        });
      }
    }
  }
  return items;
});

function queryParams(nextOffset: number) {
  return {
    pub: activePub.value,
    type: 0,
    take: 24,
    offset: nextOffset,
  };
}

async function loadInitial() {
  loading.value = true;
  error.value = null;
  offset.value = 0;
  try {
    const result = await $fetch<PostListResponse>("/api/posts", {
      query: queryParams(0),
    });
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
    const result = await $fetch<PostListResponse>("/api/posts", {
      query: queryParams(offset.value),
    });
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
        const description = post.description
          ? await renderMarkdown(withSoftBreaks(post.description))
          : "";
        const content = post.content
          ? await renderMarkdown(withSoftBreaks(post.content))
          : "";
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

function getMomentPostUrl(post: Post) {
  const identifier = getPostIdentifier(post);
  return `/moments/${identifier}`;
}

function getPublisherPicture(post: Post) {
  const pic = post.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
}

async function setPublisher(next: PublisherName) {
  await router.push(`/moments/${next}`);
}

watch(
  activePub,
  async () => {
    await loadInitial();
  },
  { immediate: true },
);

useHead({
  title: "动态",
  meta: [
    { name: "description", content: "浏览 littlesheep 的生活动态和日常碎片。" },
    { property: "og:title", content: "动态 - Goatshed" },
    {
      property: "og:description",
      content: "浏览 littlesheep 的生活动态和日常碎片。",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>

<style scoped>
.moments-page {
  max-width: 90rem;
  margin-inline: auto;
  padding-inline: 1rem;
}

@media (min-width: 640px) {
  .moments-page {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .moments-page {
    padding-inline: 2rem;
  }
}

.masonry-card {
  display: block;
  overflow: hidden;
  border-radius: var(--radius-box, 0.9rem);
  border: 1px solid color-mix(in srgb, var(--color-base-300) 70%, transparent);
  background: var(--color-base-100);
  text-decoration: none;
  transition: box-shadow 200ms ease;
}

.masonry-card:hover {
  box-shadow: 0 4px 24px oklch(0 0 0 / 0.08);
}

.masonry-img-wrap {
  position: relative;
  overflow: hidden;
}

.masonry-img {
  width: 100%;
  display: block;
  transition: transform 300ms ease;
}

.masonry-card:hover .masonry-img {
  transform: scale(1.03);
}

.masonry-count {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background: oklch(0 0 0 / 0.5);
  color: oklch(1 0 0 / 0.9);
  font-size: 0.65rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.masonry-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(
    to top,
    oklch(0 0 0 / 0.6) 0%,
    oklch(0 0 0 / 0.2) 40%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 200ms ease;
}

.masonry-card:hover .masonry-overlay {
  opacity: 1;
}

.masonry-overlay-content {
  width: 100%;
  padding: 0.75rem;
}

.masonry-text-card {
  padding: 0.875rem;
}
</style>
