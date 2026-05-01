<template>
  <main class="moment-view" data-pagefind-body>
    <div v-if="pending" class="flex h-dvh items-center justify-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="flex h-dvh items-center justify-center px-4">
      <div class="alert alert-error max-w-md">
        <span>{{ error.message }}</span>
      </div>
    </div>

    <template v-else-if="post">
      <header class="moment-header">
        <button class="btn btn-ghost btn-sm gap-1.5" @click="goBack">
          <ArrowLeft class="h-4 w-4" />
          动态
        </button>
      </header>

      <div class="moment-layout">
        <div class="moment-media">
          <div v-if="postImages.length === 1" class="moment-media-inner">
            <img
              :src="postImages[0].src"
              :alt="postImages[0].alt"
              class="moment-img"
              :style="{ viewTransitionName: `moment-img-${post.id}` }"
              loading="lazy"
            >
          </div>
          <div v-else-if="postImages.length > 1" ref="swipeTarget" class="carousel-group moment-media-inner">
            <div class="carousel-container h-full overflow-hidden">
              <div
                class="flex h-full transition-transform duration-300 ease-out"
                :style="{ transform: `translateX(-${carouselIndex * 100}%)` }"
              >
                <div
                  v-for="(img, idx) in postImages"
                  :key="idx"
                  class="flex h-full w-full flex-shrink-0 items-center justify-center"
                >
                  <img
                    :src="img.src"
                    :alt="img.alt"
                    class="moment-img"
                    :style="idx === 0 ? { viewTransitionName: `moment-img-${post.id}` } : undefined"
                    loading="lazy"
                  >
                </div>
              </div>
            </div>
            <button
              v-show="carouselIndex > 0"
              class="carousel-arrow carousel-arrow-left"
              @click="carouselIndex--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-show="carouselIndex < postImages.length - 1"
              class="carousel-arrow carousel-arrow-right"
              @click="carouselIndex++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
            <div class="carousel-progress">
              <div class="carousel-progress-track">
                <div
                  class="carousel-progress-bar"
                  :style="{ width: `${((carouselIndex + 1) / postImages.length) * 100}%` }"
                />
              </div>
            </div>
          </div>
          <div v-else class="moment-media-inner flex items-center justify-center bg-base-200/30">
            <ImageOff class="h-16 w-16 text-base-content/20" />
          </div>
        </div>

        <div class="moment-detail">
          <div class="moment-detail-inner">
            <div class="mb-4 flex items-center gap-2 text-xs text-base-content/70">
              <div class="inline-flex items-center gap-1.5">
                <img
                  v-if="publisherPictureUrl"
                  :src="publisherPictureUrl"
                  :alt="post.publisher.name"
                  class="h-4 w-4 rounded-full object-cover"
                  loading="lazy"
                >
                <span class="opacity-70">{{ post.publisher.nick || post.publisher.name }}</span>
              </div>
              <span>{{ publishedAt }}</span>
              <span v-if="post.viewsUnique">{{ post.viewsUnique }} 次阅读</span>
            </div>

            <h1 v-if="post.title" class="mb-4 text-lg font-bold leading-tight sm:text-xl">
              {{ post.title }}
            </h1>

            <article
              v-if="renderedDescription"
              class="prose-goatshed max-w-none text-sm leading-6 text-base-content/80 mb-4"
              v-html="renderedDescription"
            />
            <article
              id="article"
              class="prose-goatshed max-w-none"
              v-html="renderedContent"
            />

            <div v-if="post.tags?.length || post.id" class="moment-meta mt-6 flex flex-col gap-3">
              <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in post.tags"
                  :key="tag.id"
                  class="badge badge-ghost badge-sm"
                >
                  #{{ tag.slug }}
                </span>
              </div>

              <div v-if="post.id" class="flex items-center gap-3">
                <a
                  :href="`https://solian.app/posts/${post.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs text-primary/70 transition-colors hover:text-primary"
                >
                  <ExternalLink class="h-3.5 w-3.5" />
                  在 Solian 查看
                </a>
              </div>
            </div>

            <div
              class="post-divider relative my-8 flex items-center justify-center gap-4"
              aria-hidden="true"
            >
              <div
                class="relative h-px flex-1 bg-linear-to-r from-transparent via-base-300/40 to-primary/30"
              >
                <div
                  class="absolute inset-0 bg-linear-to-r from-transparent via-primary/35 to-primary/35 blur-[2px]"
                />
              </div>
              <div
                class="relative z-10 flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary/50 select-none"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_var(--color-primary)]"
                />
                结束
              </div>
              <div
                class="relative h-px flex-1 bg-linear-to-l from-transparent via-base-300/40 to-primary/30"
              >
                <div
                  class="absolute inset-0 bg-linear-to-l from-transparent via-primary/35 to-primary/35 blur-[2px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ImageOff } from "lucide-vue-next";

definePageMeta({ layout: "blank" });

const route = useRoute();
const config = useRuntimeConfig();

function goBack() {
  navigateTo(`/moments/${activePub.value}`);
}

const activePub = computed(() => {
  const pub = route.params.pub;
  return typeof pub === "string" ? pub : "littlesheep";
});

const postSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug.join("/") : slug;
});

const postApiId = computed(() => {
  const pub = activePub.value;
  const slug = postSlug.value;
  return `${pub}/${slug}`;
});

const {
  data: post,
  pending,
  error,
} = await useAsyncData(`moment-${postApiId.value}`, () =>
  $fetch<Post>(`/api/posts/${postApiId.value}`),
);

watchEffect(() => {
  if (post.value?.type === 1) {
    const identifier = getPostIdentifier(post.value);
    navigateTo(`/posts/${identifier}`, { replace: true });
  }
});

const renderedContent = ref("");
const renderedDescription = ref("");
const carouselIndex = ref(0);
const swipeTarget = ref<HTMLElement | null>(null);

useSwipe(swipeTarget, {
  onSwipeLeft: () => {
    if (carouselIndex.value < postImages.value.length - 1) carouselIndex.value++;
  },
  onSwipeRight: () => {
    if (carouselIndex.value > 0) carouselIndex.value--;
  },
});

watch(
  () => post.value,
  async (p) => {
    if (p) {
      renderedContent.value = p.content ? await renderMarkdown(withSoftBreaks(p.content)) : "";
      renderedDescription.value = p.description ? await renderMarkdown(withSoftBreaks(p.description)) : "";
    } else {
      renderedContent.value = "";
      renderedDescription.value = "";
    }
  },
  { immediate: true },
);

function withSoftBreaks(input: string) {
  return input.replace(/\r?\n/g, "  \n");
}

const publishedAt = computed(() => {
  if (!post.value) return "";
  return new Date(post.value.publishedAt || post.value.createdAt).toLocaleString();
});

const postIdentifier = computed(() =>
  post.value ? getPostIdentifier(post.value) : "",
);

const postImages = computed(() => {
  if (!post.value) return [];

  const images: { src: string; alt: string }[] = [];

  if (post.value.picture?.id) {
    images.push({
      src: post.value.picture.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.value.picture.id)}`,
      alt: post.value.title || "动态图片",
    });
  }

  if (post.value.attachments?.length) {
    for (const att of post.value.attachments) {
      if (att.id && att.mimeType?.startsWith("image/")) {
        images.push({
          src: att.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(att.id)}`,
          alt: att.name || post.value.title || "动态图片",
        });
      }
    }
  }

  if (images.length === 0 && post.value.background?.id) {
    images.push({
      src: post.value.background.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(post.value.background.id)}`,
      alt: post.value.title || "动态图片",
    });
  }

  return images;
});

const publisherPictureUrl = computed(() => {
  const pic = post.value?.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const postOgImage = computed(() => {
  if (!post.value) return "https://littlesheep.me/og-image.png";

  const pic = post.value.picture;
  if (pic?.id) {
    return pic.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`;
  }
  const bg = post.value.background;
  if (bg?.id) {
    return bg.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
  }
  const attach = post.value.attachments?.[0];
  if (attach?.id) {
    return attach.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(attach.id)}`;
  }
  return "https://littlesheep.me/og-image.png";
});

useHead(() => ({
  title: post.value?.title || "动态",
  meta: [
    {
      name: "description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { property: "og:title", content: post.value?.title || "动态" },
    {
      property: "og:description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { property: "og:type", content: "article" },
    {
      property: "og:url",
      content: `https://littlesheep.me/moments/${postIdentifier.value}`,
    },
    { property: "og:image", content: postOgImage.value },
    {
      property: "article:published_time",
      content: post.value?.publishedAt || post.value?.createdAt,
    },
    {
      property: "article:author",
      content: post.value?.publisher?.nick || post.value?.publisher?.name || "littlesheep",
    },
    { name: "twitter:title", content: post.value?.title || "动态" },
    {
      name: "twitter:description",
      content: post.value?.description || "在 Goatshed 查看这条动态。",
    },
    { name: "twitter:image", content: postOgImage.value },
  ],
  link: [
    {
      rel: "canonical",
      href: `https://littlesheep.me/moments/${postIdentifier.value}`,
    },
  ],
}));
</script>

<style scoped>
.moment-view {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.moment-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  padding: 0.75rem 1rem;
}

.moment-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.moment-media {
  position: relative;
  flex: 1 1 60%;
  min-height: 0;
  background: var(--color-base-200);
  overflow: hidden;
}

.moment-media-inner {
  position: absolute;
  inset: 0;
}

.moment-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

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
  left: 0.75rem;
}

.carousel-arrow-right {
  right: 0.75rem;
}

.carousel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0.5rem 1rem;
}

.carousel-progress-track {
  height: 3px;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.25);
  overflow: hidden;
}

.carousel-progress-bar {
  height: 100%;
  border-radius: 9999px;
  background: oklch(1 0 0 / 0.85);
  transition: width 300ms ease-out;
}

.moment-detail {
  flex: 1 1 40%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.moment-detail-inner {
  padding: 1.25rem 1rem 2rem;
}

.post-divider {
  max-width: 32rem;
  margin-inline: auto;
}

@media (min-width: 1024px) {
  .moment-layout {
    flex-direction: row;
  }

  .moment-media {
    flex: 1 1 55%;
  }

  .moment-detail {
    flex: 0 0 45%;
    max-width: 32rem;
  }

  .moment-detail-inner {
    padding: 2rem 2rem 3rem;
  }
}
</style>
