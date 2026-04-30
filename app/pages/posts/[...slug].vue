<template>
  <main class="page-shell mx-auto py-8" data-pagefind-body>
    <ShellBreadcrumb :path="`/posts/${postIdentifier}`" />

    <section class="post-header relative mb-10 mt-8 text-center">
      <div class="post-hero-bg" :style="heroBackgroundStyle" />
      <div
        class="relative z-10 rounded-3xl border border-base-300/30 bg-base-200/30 px-6 py-8 backdrop-blur-md sm:px-10 sm:py-12"
      >
        <h1
          class="post-title wrap-break-word text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {{ post?.title || "无标题文章" }}
        </h1>

        <div
          v-if="post?.tags.length"
          class="mt-4 flex flex-wrap justify-center gap-2"
        >
          <span
            v-for="tag in post.tags"
            :key="tag.id"
            class="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
          >
            <span class="opacity-50">#</span>
            {{ tag.slug }}
          </span>
        </div>

        <div
          class="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          <div
            class="inline-flex items-center gap-1.5 rounded-lg border border-base-300/40 bg-base-100/40 px-2.5 py-1"
          >
            <img
              v-if="publisherPictureUrl"
              :src="publisherPictureUrl"
              :alt="post?.publisher?.name || '发布者'"
              class="h-5 w-5 rounded-full object-cover"
              loading="lazy"
            />
            <span class="opacity-70">{{
              post?.publisher?.nick || post?.publisher?.name
            }}</span>
          </div>
          <div
            class="inline-flex items-center gap-1.5 rounded-lg border border-base-300/40 bg-base-100/40 px-2.5 py-1"
          >
            <span class="opacity-70">{{ publishedAt }}</span>
          </div>
          <a
            :href="`https://solian.app/posts/${post?.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-primary transition-colors hover:bg-primary/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span class="text-xs">在 Solian 查看</span>
          </a>
        </div>
      </div>
    </section>

    <div v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <div v-else-if="post" class="post-content-grid">
      <div class="post-main-column">
        <aside v-if="tocItems.length" class="post-toc-mobile mb-4 xl:hidden">
          <PostToc :items="tocItems" />
        </aside>

        <article
          id="article"
          class="prose-goatshed post-article min-w-0 p-0 sm:p-6 lg:p-7"
          v-html="renderedContent"
        />
      </div>

      <aside v-if="tocItems.length" class="post-toc hidden xl:block">
        <PostToc :items="tocItems" />
      </aside>
    </div>

    <section
      v-if="postPictureUrl || (!isArticle && postAttachments.length)"
      class="mt-5 space-y-3"
      data-pagefind-ignore
    >
      <img
        v-if="postPictureUrl"
        :src="postPictureUrl"
        :alt="post?.title || '文章配图'"
        class="w-full rounded-2xl border border-base-300/40 object-cover"
        loading="lazy"
      />

      <div
        v-if="!isArticle && postAttachments.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <a
          v-for="file in postAttachments"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
          class="block overflow-hidden rounded-xl border border-base-300/40"
        >
          <img
            :src="file.url"
            :alt="file.name || '文章附件'"
            class="h-32 w-full object-cover"
            loading="lazy"
          />
        </a>
      </div>
    </section>

    <div
      class="relative mb-8 mt-12 flex items-center justify-center gap-4"
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
        :to="`/posts/${prevPostIdentifier}`"
        class="post-nav-link group relative flex flex-col gap-1 rounded-2xl border border-base-300/30 px-5 py-4 transition-all duration-300 hover:border-primary/40"
      >
        <div class="post-nav-bg" />
        <div class="flex items-center gap-1.5">
          <span
            class="text-[10px] uppercase tracking-wider text-base-content/45"
            >上一篇</span
          >
        </div>
        <span
          class="line-clamp-2 text-sm leading-snug font-medium text-base-content/80 transition-colors duration-200 group-hover:text-primary"
        >
          {{ prevPost.title || "无标题文章" }}
        </span>
      </NuxtLink>
      <div v-else />

      <NuxtLink
        v-if="nextPost"
        :to="`/posts/${nextPostIdentifier}`"
        class="post-nav-link group relative col-start-2 flex flex-col items-end gap-1 rounded-2xl border border-base-300/30 px-5 py-4 text-end transition-all duration-300 hover:border-primary/40"
      >
        <div class="post-nav-bg" />
        <div class="flex items-center gap-1.5">
          <span
            class="text-[10px] uppercase tracking-wider text-base-content/45"
            >下一篇</span
          >
        </div>
        <span
          class="line-clamp-2 text-sm leading-snug font-medium text-base-content/80 transition-colors duration-200 group-hover:text-primary"
        >
          {{ nextPost.title || "无标题文章" }}
        </span>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getPostIdentifier } from "~/utils/post";
import { extractToc, injectHeadingIds, type TocItem } from "~/utils/toc";

const route = useRoute();
const config = useRuntimeConfig();

const postSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug.join("/") : slug;
});

const {
  data: post,
  pending,
  error,
} = await useAsyncData(`post-${postSlug.value}`, () =>
  $fetch<Post>(`/api/posts/${postSlug.value}`),
);
const { data: prevPost } = await useAsyncData(
  `post-${postSlug.value}-prev`,
  () => $fetch<Post | null>(`/api/posts/${postSlug.value}/prev`),
);
const { data: nextPost } = await useAsyncData(
  `post-${postSlug.value}-next`,
  () => $fetch<Post | null>(`/api/posts/${postSlug.value}/next`),
);

const renderedContent = ref("");

watch(
  () => post.value?.content,
  async (content) => {
    if (content) {
      const rendered = await renderMarkdown(content);
      renderedContent.value = injectHeadingIds(rendered);
      tocItems.value = extractToc(renderedContent.value);
    } else {
      renderedContent.value = "";
      tocItems.value = [];
    }
  },
  { immediate: true },
);

const tocItems = ref<TocItem[]>([]);

const publishedAt = computed(() => {
  if (!post.value) return "";
  return new Date(
    post.value.publishedAt || post.value.createdAt,
  ).toLocaleString();
});

const isArticle = computed(() => post.value?.type === 1);

const postIdentifier = computed(() =>
  post.value ? getPostIdentifier(post.value) : "",
);
const prevPostIdentifier = computed(() =>
  prevPost.value ? getPostIdentifier(prevPost.value) : "",
);
const nextPostIdentifier = computed(() =>
  nextPost.value ? getPostIdentifier(nextPost.value) : "",
);

const postPictureUrl = computed(() => {
  const pic = post.value?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const heroBackgroundStyle = computed(() => {
  const bg =
    post.value?.background ||
    post.value?.picture ||
    post.value?.attachments?.[0];
  if (!bg?.id) return undefined;
  const url =
    bg.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)), url(${url})`,
  };
});

const publisherPictureUrl = computed(() => {
  const pic = post.value?.publisher?.picture;
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const postAttachments = computed(() => {
  const files = post.value?.attachments || [];
  return files
    .filter((file) => file?.id)
    .slice(0, 9)
    .map((file) => ({
      id: file.id,
      name: file.name,
      url:
        file.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(file.id)}`,
    }));
});

const postOgImage = computed(() => {
  const pic = post.value?.picture;
  if (pic?.id) {
    return (
      pic.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
    );
  }
  const bg = post.value?.background;
  if (bg?.id) {
    return (
      bg.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`
    );
  }
  const attach = post.value?.attachments?.[0];
  if (attach?.id) {
    return (
      attach.url ||
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(attach.id)}`
    );
  }
  return "https://littlesheep.me/og-image.png";
});

useHead(() => ({
  title: post.value?.title || "文章",
  meta: [
    {
      name: "description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { property: "og:title", content: post.value?.title || "文章" },
    {
      property: "og:description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { property: "og:type", content: "article" },
    {
      property: "og:url",
      content: `https://littlesheep.me/posts/${postIdentifier.value}`,
    },
    { property: "og:image", content: postOgImage.value },
    {
      property: "article:published_time",
      content: post.value?.publishedAt || post.value?.createdAt,
    },
    {
      property: "article:author",
      content:
        post.value?.publisher?.nick ||
        post.value?.publisher?.name ||
        "littlesheep",
    },
    { name: "twitter:title", content: post.value?.title || "文章" },
    {
      name: "twitter:description",
      content: post.value?.description || "在 Goatshed 阅读这篇文章。",
    },
    { name: "twitter:image", content: postOgImage.value },
  ],
  link: [
    {
      rel: "canonical",
      href: `https://littlesheep.me/posts/${postIdentifier.value}`,
    },
  ],
}));
</script>

<style scoped>
.post-title {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    color-mix(in oklab, var(--color-primary) 60%, var(--color-base-content)) 25%,
    var(--color-base-content) 50%,
    var(--color-base-content) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.post-hero-bg {
  position: absolute;
  inset: -2px;
  opacity: 0.6;
  background:
    radial-gradient(
      circle at 20% 5%,
      color-mix(in oklab, var(--color-primary) 12%, transparent) 0%,
      transparent 45%
    ),
    radial-gradient(
      ellipse 80% 60% at 80% 95%,
      color-mix(in oklab, var(--color-primary) 8%, transparent) 0%,
      transparent 55%
    );
  pointer-events: none;
  z-index: 0;
  border-radius: 1.5rem;
}

.post-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 52rem;
  margin-inline: auto;
}

@media (min-width: 1280px) {
  .post-content-grid {
    grid-template-columns: 1fr 16rem;
    max-width: 72rem;
    gap: 1.5rem;
  }
}

.post-main-column {
  min-width: 0;
}

.post-toc-mobile {
  position: relative;
}

.post-toc-mobile :deep(.toc-wrapper) {
  position: relative;
  top: 0;
}

.post-article {
  padding: 0 1rem;
  border-radius: 0;
}

@media (min-width: 640px) {
  .post-article {
    padding: 1.5rem 1.75rem;
    border-radius: var(--radius-box, 0.9rem);
    border: 1px solid color-mix(in srgb, var(--color-base-300) 70%, transparent);
    background-color: var(--color-base-100);
  }
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
