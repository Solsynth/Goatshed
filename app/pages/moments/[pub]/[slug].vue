<template>
  <main class="page-shell mx-auto py-8" data-pagefind-body>
    <ShellBreadcrumb :path="`/moments/${postIdentifier}`" />

    <div v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <template v-else-if="post">
      <section class="mb-6">
        <div class="flex items-center gap-2 text-xs text-base-content/65">
          <span class="badge badge-soft badge-primary badge-sm">{{ post.publisher.name }}</span>
          <span>{{ publishedAt }}</span>
          <span v-if="post.viewsUnique">{{ post.viewsUnique }} 次阅读</span>
        </div>

        <h1 v-if="post.title" class="mt-2 text-xl font-bold leading-tight sm:text-2xl">
          {{ post.title }}
        </h1>
      </section>

      <div v-if="postImages.length > 0" class="moment-grid">
        <div class="moment-images">
          <div class="sticky top-24">
            <div v-if="postImages.length === 1" class="overflow-hidden rounded-lg bg-base-200/50 p-2">
              <img
                :src="postImages[0].src"
                :alt="postImages[0].alt"
                class="max-h-[60vh] w-auto mx-auto"
                loading="lazy"
              >
            </div>
            <div v-else class="group relative rounded-lg bg-base-200/50 p-2">
              <div class="carousel-container overflow-hidden rounded-lg">
                <div
                  class="flex transition-transform duration-300 ease-out"
                  :style="{ transform: `translateX(-${carouselIndex * 100}%)` }"
                >
                  <div
                    v-for="(img, idx) in postImages"
                    :key="idx"
                    class="w-full flex-shrink-0"
                  >
                    <img
                      :src="img.src"
                      :alt="img.alt"
                      class="max-h-[60vh] w-auto mx-auto"
                      loading="lazy"
                    >
                  </div>
                </div>
              </div>
              <button
                v-if="carouselIndex > 0"
                class="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm btn-neutral opacity-0 group-hover:opacity-100 transition-opacity"
                @click="carouselIndex--"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                v-if="carouselIndex < postImages.length - 1"
                class="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm btn-neutral opacity-0 group-hover:opacity-100 transition-opacity"
                @click="carouselIndex++"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div class="mt-2 flex justify-center gap-1.5">
                <button
                  v-for="(_, idx) in postImages"
                  :key="idx"
                  class="h-2 w-2 rounded-full transition-colors"
                  :class="carouselIndex === idx ? 'bg-primary' : 'bg-base-content/20'"
                  @click="carouselIndex = idx"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="moment-content min-w-0">
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
        </div>
      </div>

      <div v-else class="moment-content-centered">
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
      </div>

      <div
        class="post-divider relative mb-8 mt-12 flex items-center justify-center gap-4"
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

      <div class="grid grid-cols-2 gap-3 mt-10" data-pagefind-ignore>
        <NuxtLink
          v-if="prevPost"
          :to="`/moments/${prevPostIdentifier}`"
          class="post-nav-link group relative flex flex-col gap-1 rounded-2xl border border-base-300/30 px-5 py-4 transition-all duration-300 hover:border-primary/40"
        >
          <div class="post-nav-bg" />
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] uppercase tracking-wider text-base-content/45">上一篇</span>
          </div>
          <span
            class="line-clamp-2 text-sm leading-snug font-medium text-base-content/80 transition-colors duration-200 group-hover:text-primary"
          >
            {{ prevPost.title || "无标题动态" }}
          </span>
        </NuxtLink>
        <div v-else />

        <NuxtLink
          v-if="nextPost"
          :to="`/moments/${nextPostIdentifier}`"
          class="post-nav-link group relative col-start-2 flex flex-col items-end gap-1 rounded-2xl border border-base-300/30 px-5 py-4 text-end transition-all duration-300 hover:border-primary/40"
        >
          <div class="post-nav-bg" />
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] uppercase tracking-wider text-base-content/45">下一篇</span>
          </div>
          <span
            class="line-clamp-2 text-sm leading-snug font-medium text-base-content/80 transition-colors duration-200 group-hover:text-primary"
          >
            {{ nextPost.title || "无标题动态" }}
          </span>
        </NuxtLink>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

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

const { data: prevPost } = await useAsyncData(
  `moment-${postApiId.value}-prev`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/prev`),
);

const { data: nextPost } = await useAsyncData(
  `moment-${postApiId.value}-next`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/next`),
);

watchEffect(() => {
  if (post.value?.type === 1) {
    const identifier = getPostIdentifier(post.value);
    router.replace(`/posts/${identifier}`);
  }
});

const renderedContent = ref("");
const renderedDescription = ref("");
const carouselIndex = ref(0);

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

const prevPostIdentifier = computed(() =>
  prevPost.value ? getPostIdentifier(prevPost.value) : "",
);

const nextPostIdentifier = computed(() =>
  nextPost.value ? getPostIdentifier(nextPost.value) : "",
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
.moment-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .moment-grid {
    grid-template-columns: minmax(280px, 40%) 1fr;
  }
}

.moment-images {
  min-width: 0;
}

.moment-content {
  min-width: 0;
}

.moment-content-centered {
  max-width: 52rem;
  margin-inline: auto;
}

.post-divider {
  max-width: 52rem;
  margin-inline: auto;
}

.post-nav-link {
  background: color-mix(in srgb, var(--color-base-300) 8%, transparent);
  position: relative;
}

.post-nav-bg {
  position: absolute;
  inset: -1px;
  opacity: 0.4;
  transition: opacity 0.35s ease;
  background:
    radial-gradient(
      ellipse 80% 60% at 20% 80%,
      color-mix(in oklab, var(--color-primary) 12%, transparent) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 60% 70% at 80% 20%,
      color-mix(in oklab, var(--color-primary) 8%, transparent) 0%,
      transparent 60%
    );
  filter: blur(16px);
  pointer-events: none;
  z-index: -1;
  border-radius: inherit;
}

.post-nav-link:hover .post-nav-bg {
  opacity: 1;
}
</style>
