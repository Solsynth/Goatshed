<template>
  <main class="page-shell relative min-w-0 py-8">
    <section id="hero" class="relative pb-14 pt-10 sm:pb-20 sm:pt-14">
      <div class="relative z-10">
        <ShellBreadcrumb :path="`/blog/${activePub}`" />

        <h1 class="hero-title mb-3 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          Goatshed
          <a href="/rss.xml" class="ml-1 inline-block align-middle" aria-label="RSS feed" title="RSS feed">
            <Rss class="h-5 w-5 opacity-40 transition-opacity duration-300 hover:opacity-100" />
          </a>
        </h1>

        <p class="mt-7 max-w-xl text-base leading-relaxed opacity-75 sm:text-lg">
          把好奇心写进代码，在这里记录 Web 开发、软件架构与技术世界里的思考。
        </p>

        <div class="mt-6 max-w-xl">
          <PublisherSwitcher :publishers="PUBLISHERS" :active="activePub" @change="setPublisher" />
        </div>
      </div>
    </section>

    <section v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </section>

    <section v-else>
      <section v-if="pinnedPosts.length" id="featured" class="pb-6">
          <div class="mb-6 flex items-center gap-3">
            <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
              <Sparkles class="h-4 w-4" />
              精选
            </h2>
            <div class="h-px flex-1 bg-base-300/50" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <PostCard v-for="post in pinnedPosts" :key="post.id" :post="post" />
          </div>
      </section>

      <section id="recent-posts" class="pb-6 pt-6">
          <div class="mb-6 flex items-center gap-3">
            <h2 class="text-sm font-bold uppercase tracking-widest">最新</h2>
            <div class="h-px flex-1 bg-base-300/50" />
            <span class="select-none text-xs text-primary/50">[{{ recentPosts.length }}/{{ total }}]</span>
          </div>

          <div class="grid min-w-0 gap-5 lg:grid-cols-[1fr_19rem]">
            <div class="min-w-0 space-y-4">
              <PostCard v-for="post in recentPosts" :key="post.id" :post="post" />

              <div class="mb-4 mt-8 flex w-full justify-center">
                <NuxtLink
                  :to="`/posts?pub=${activePub}&page=0`"
                  class="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-8 py-4 text-base font-bold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 sm:w-auto"
                >
                  浏览全部文章
                  <ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </NuxtLink>
              </div>
            </div>

            <PublisherSidebar v-if="showSidebar" :publisher-name="activePub" class="h-fit min-w-0 lg:sticky lg:top-24" />
          </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowRight, Rss, Sparkles } from "lucide-vue-next";
import { PUBLISHERS, isPublisherName, type PublisherName } from "~/constants/publishers";
import type { Post } from "~/types/post";

const route = useRoute();
const router = useRouter();

const activePub = ref<PublisherName>(
  typeof route.query.pub === "string" && isPublisherName(route.query.pub)
    ? route.query.pub
    : "littlesheep",
);

const { data: recentResponse, pending: loading, error } = await useAsyncData(
  "posts-home",
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: { pub: activePub.value, type: 1, take: 6, offset: 0 },
    }),
  {
    watch: [activePub],
    default: () => ({ posts: [], total: 0 }),
  },
);

const recentPosts = computed(() => recentResponse.value?.posts ?? []);
const total = computed(() => recentResponse.value?.total ?? 0);

const { data: pinnedPostsData } = await useFetch<Post[]>(
  () => `/api/publishers/${activePub.value}/pinned`,
  {
    default: () => [],
    watch: [activePub],
  },
);

const pinnedPosts = computed(() => pinnedPostsData.value ?? []);

const showSidebar = computed(
  () => typeof route.query.pub === "string" && isPublisherName(route.query.pub),
);

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

useHead({
  title: "博客",
  meta: [
    { name: "description", content: "浏览 littlesheep 的技术博客文章，记录 Web 开发、软件架构与技术思考。" },
    { property: "og:title", content: "博客 - Goatshed" },
    { property: "og:description", content: "浏览 littlesheep 的技术博客文章，记录 Web 开发、软件架构与技术思考。" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://littlesheep.me" },
  ],
});
</script>

<style scoped>
.hero-title {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    color-mix(in oklab, var(--color-primary) 50%, var(--color-base-content)) 20%,
    var(--color-base-content) 35%,
    var(--color-base-content) 65%,
    color-mix(in oklab, var(--color-primary) 50%, var(--color-base-content)) 80%,
    var(--color-primary) 100%
  );
  background-size: 250% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 6s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}
</style>
