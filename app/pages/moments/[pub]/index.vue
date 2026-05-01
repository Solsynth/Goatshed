<template>
  <main class="page-shell min-w-0 py-8">
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

    <section v-else class="grid min-w-0 gap-5 lg:grid-cols-[1fr_19rem]">
      <div class="min-w-0 space-y-4">
        <article
          v-for="post in moments"
          :key="post.id"
          class="app-panel overflow-hidden p-4 sm:p-5"
        >
          <div
            class="mb-3 flex items-center gap-2 text-xs text-base-content/70"
          >
            <div class="inline-flex items-center gap-1.5">
              <img
                v-if="getPublisherPicture(post)"
                :src="getPublisherPicture(post)"
                :alt="post.publisher.name"
                class="h-4 w-4 rounded-full object-cover"
                loading="lazy"
              />
              <span class="opacity-70">{{
                post.publisher.nick || post.publisher.name
              }}</span>
            </div>
            <span>{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            <span>{{ post.viewsUnique }} 次阅读</span>
          </div>

          <NuxtLink
            :to="getMomentPostUrl(post)"
            class="block hover:no-underline"
          >
            <h2
              v-if="post.title"
              class="text-base font-bold leading-snug text-base-content/90"
            >
              {{ post.title }}
            </h2>

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
          </NuxtLink>

          <div
            v-if="postImages(post).length > 0"
            class="mt-3 rounded-lg bg-base-200/50 p-2"
          >
            <div
              v-if="postImages(post).length === 1"
              class="overflow-hidden rounded-lg"
            >
              <img
                :src="postImages(post)[0].src"
                :alt="postImages(post)[0].alt"
                class="max-h-[480px] w-auto mx-auto"
                :style="{ viewTransitionName: `moment-img-${post.id}` }"
                loading="lazy"
              />
            </div>
            <div
              v-else
              class="carousel-group relative"
              @touchstart="onTouchStart($event, post.id)"
              @touchmove="onTouchMove($event, post.id)"
              @touchend="onTouchEnd(post.id, postImages(post).length)"
            >
              <div class="carousel-container overflow-hidden rounded-lg">
                <div
                  class="flex transition-transform duration-300 ease-out"
                  :style="{
                    transform: `translateX(-${carouselIndex[post.id] * 100}%)`,
                  }"
                >
                  <div
                    v-for="(img, idx) in postImages(post)"
                    :key="idx"
                    class="w-full flex-shrink-0"
                  >
                    <img
                      :src="img.src"
                      :alt="img.alt"
                      class="max-h-[480px] w-auto mx-auto"
                      :style="idx === 0 ? { viewTransitionName: `moment-img-${post.id}` } : undefined"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <button
                v-show="carouselIndex[post.id] > 0"
                class="carousel-arrow carousel-arrow-left"
                @click="carouselIndex[post.id]--"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                v-show="carouselIndex[post.id] < postImages(post).length - 1"
                class="carousel-arrow carousel-arrow-right"
                @click="carouselIndex[post.id]++"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
              <div class="carousel-progress">
                <div class="carousel-progress-track">
                  <div
                    class="carousel-progress-bar"
                    :style="{ width: `${((carouselIndex[post.id] + 1) / postImages(post).length) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>

        <div class="flex justify-center py-3">
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
import {
  PUBLISHERS,
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post, PostListResponse } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

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
const carouselIndex = ref<Record<string, number>>({});

const touchState = ref<Record<string, { startX: number; startY: number; dx: number; tracking: boolean }>>({});

function onTouchStart(e: TouchEvent, postId: string) {
  const t = e.touches[0];
  touchState.value[postId] = { startX: t.clientX, startY: t.clientY, dx: 0, tracking: true };
}

function onTouchMove(e: TouchEvent, postId: string) {
  const state = touchState.value[postId];
  if (!state?.tracking) return;
  const t = e.touches[0];
  state.dx = t.clientX - state.startX;
  if (Math.abs(t.clientY - state.startY) > Math.abs(state.dx)) {
    state.tracking = false;
  }
}

function onTouchEnd(postId: string, total: number) {
  const state = touchState.value[postId];
  if (!state?.tracking) return;
  state.tracking = false;
  const threshold = 40;
  if (state.dx < -threshold && carouselIndex.value[postId] < total - 1) {
    carouselIndex.value[postId]++;
  } else if (state.dx > threshold && carouselIndex.value[postId] > 0) {
    carouselIndex.value[postId]--;
  }
}

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

function postImages(post: Post) {
  const images: { src: string; alt: string }[] = [];

  if (post.picture?.id) {
    images.push({
      src:
        post.picture.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.picture.id)}`,
      alt: post.title || "动态图片",
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
    });
  }

  return images;
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
.carousel-group {
  position: relative;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: oklch(0.2 0 0 / 0.55);
  color: oklch(1 0 0 / 0.9);
  backdrop-filter: blur(4px);
  opacity: 0;
  transform: translateY(-50%) scale(0.85);
  transition: opacity 200ms ease, transform 200ms ease;
  pointer-events: none;
  cursor: pointer;
  border: none;
}

.carousel-group:hover .carousel-arrow {
  opacity: 1;
  transform: translateY(-50%) scale(1);
  pointer-events: auto;
}

.carousel-arrow:active {
  transform: translateY(-50%) scale(0.92);
}

.carousel-arrow-left {
  left: 0.5rem;
}

.carousel-arrow-right {
  right: 0.5rem;
}

.carousel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0.375rem 0.75rem;
}

.carousel-progress-track {
  height: 3px;
  border-radius: 9999px;
  background: oklch(0 0 0 / 0.12);
  overflow: hidden;
}

.carousel-progress-bar {
  height: 100%;
  border-radius: 9999px;
  background: var(--color-primary);
  transition: width 300ms ease-out;
}
</style>
