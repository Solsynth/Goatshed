<template>
  <main class="page-shell mx-auto py-8" data-pagefind-body>
    <ShellBreadcrumb :path="`/posts/${postIdentifier}`" />

    <section class="post-header relative mb-10 mt-8">
      <article
        v-if="post"
        class="post-tile post-tile-detail min-w-0"
        :style="{ viewTransitionName: `post-${post.id}` }"
        @mousemove="onTileMove"
      >
        <NuxtLink
          v-if="postPictureUrl"
          :to="`/posts/${postIdentifier}`"
          class="-mx-6 -mt-6 mb-5 block overflow-hidden rounded-t-box border-b border-base-300/40"
        >
          <img
            :src="postPictureUrl"
            :alt="post?.title || '文章配图'"
            class="aspect-video w-full object-cover"
            loading="lazy"
          />
        </NuxtLink>

        <div class="relative flex min-w-0 flex-col gap-3">
          <div
            v-if="heroBackgroundStyle"
            class="post-hero-bg"
            :style="heroBackgroundStyle"
          />

          <div
            class="relative z-10 flex flex-wrap items-center gap-2 text-xs text-base-content/70"
          >
            <div class="inline-flex items-center gap-1.5">
              <img
                v-if="publisherPictureUrl"
                :src="publisherPictureUrl"
                :alt="post?.publisher?.name || '发布者'"
                class="h-4 w-4 rounded-full object-cover"
                loading="lazy"
              />
              <span class="opacity-70">{{
                post?.publisher?.nick || post?.publisher?.name
              }}</span>
            </div>
            <span>{{ publishedAt }}</span>
            <span v-if="post?.viewsUnique">{{ post.viewsUnique }} 次阅读</span>
          </div>

          <h1
            class="relative z-10 text-xl font-bold leading-tight sm:text-2xl lg:text-3xl"
          >
            {{ post?.title || "无标题文章" }}
          </h1>

          <p
            v-if="post?.description"
            class="relative z-10 text-sm text-base-content/70 line-clamp-3"
          >
            {{ post.description }}
          </p>

          <div
            v-if="post?.tags.length"
            class="relative z-10 flex flex-wrap gap-1"
          >
            <span
              v-for="tag in post.tags"
              :key="tag.id"
              class="badge badge-ghost badge-sm"
            >
              #{{ tag.slug }}
            </span>
          </div>

          <div class="relative z-10 flex items-center gap-2 pt-1">
            <a
              :href="`https://solian.app/posts/${post?.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs text-primary transition-colors hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
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
              在 Solian 查看
            </a>
          </div>
        </div>
      </article>
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
      v-else-if="!isArticle && postAttachments.length"
      class="mt-5"
      data-pagefind-ignore
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <a
          v-for="file in postAttachments"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
          class="block overflow-hidden rounded-xl border border-base-300/40 transition-transform hover:scale-[1.02]"
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

    <section class="mt-8" data-pagefind-ignore>
      <div class="flex items-center gap-4 mb-6">
        <ReactionBar :post-id="post.id" v-if="post?.id" />
      </div>
      <CommentSection :post-id="post.id" v-if="post?.id" />
    </section>

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
} = await useAsyncData(`post-${postApiId.value}`, () =>
  $fetch<Post>(`/api/posts/${postApiId.value}`),
);
const { data: prevPost } = await useAsyncData(
  `post-${postApiId.value}-prev`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/prev`),
);
const { data: nextPost } = await useAsyncData(
  `post-${postApiId.value}-next`,
  () => $fetch<Post | null>(`/api/posts/${postApiId.value}/next`),
);

const renderedContent = ref("");
const tocItems = ref<TocItem[]>([]);

watchEffect(() => {
  if (post.value?.type === 0) {
    const identifier = getPostIdentifier(post.value);
    router.replace(`/moments/${identifier}`);
  }
});

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
  const pic = post.value?.picture || post.value?.attachments?.[0];
  if (!pic?.id) return null;
  return (
    pic.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(pic.id)}`
  );
});

const heroBackgroundStyle = computed(() => {
  const bg = post.value?.background;
  if (!bg?.id) return null;
  const url =
    bg.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`;
  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.05)), url(${url})`,
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

function onTileMove(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  element.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  element.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}

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
      `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}}`
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
.post-header {
  position: relative;
}

.post-tile-detail {
  padding: 1.5rem;
}

.post-hero-bg {
  position: absolute;
  inset: -1.5rem;
  opacity: 0.35;
  background:
    radial-gradient(
      circle at 15% 10%,
      color-mix(in oklab, var(--color-primary) 18%, transparent) 0%,
      transparent 35%
    ),
    radial-gradient(
      ellipse 70% 50% at 85% 85%,
      color-mix(in oklab, var(--color-primary) 12%, transparent) 0%,
      transparent 45%
    );
  pointer-events: none;
  z-index: 0;
  border-radius: var(--radius-box, 0.9rem);
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
