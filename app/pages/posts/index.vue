<template>
  <main class="page-shell min-w-0 py-8">
    <ShellBreadcrumb path="/posts" />

    <section class="mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">文章</h1>
      <p class="mt-2 text-sm text-base-content/70">
        按页浏览所选发布者的文章列表。
      </p>

      <div class="mt-5 max-w-xl">
        <PublisherSwitcher
          :publishers="PUBLISHERS"
          :active="activePub"
          @change="setPublisher"
        />
      </div>
    </section>

    <section v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-dots loading-lg" />
    </section>

    <section v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </section>

    <section v-else class="grid min-w-0 gap-5 lg:grid-cols-[1fr_19rem]">
      <div class="min-w-0 space-y-4">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />

        <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            class="btn btn-sm btn-outline"
            :disabled="currentPage <= 0"
            @click="setPage(currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
            上一页
          </button>

          <button
            v-for="n in visiblePages"
            :key="n"
            class="btn btn-sm"
            :class="n === currentPage ? 'btn-primary' : 'btn-ghost'"
            @click="setPage(n)"
          >
            {{ n }}
          </button>

          <button
            class="btn btn-sm btn-outline"
            :disabled="currentPage >= maxPage"
            @click="setPage(currentPage + 1)"
          >
            下一页
            <ChevronRight class="h-4 w-4" />
          </button>
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
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import {
  PUBLISHERS,
  isPublisherName,
  type PublisherName,
} from "~/constants/publishers";
import type { Post } from "~/types/post";

const route = useRoute();
const router = useRouter();

const pageSize = 12;

const activePub = computed<PublisherName>(() => {
  const value = route.query.pub;
  return typeof value === "string" && isPublisherName(value)
    ? value
    : "littlesheep";
});

const currentPage = computed(() => {
  const raw = Number(route.query.page);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
});

const { data, pending, error } = await useAsyncData(
  "posts-list",
  () =>
    $fetch<{ posts: Post[]; total: number }>("/api/posts", {
      query: {
        pub: activePub.value,
        type: 1,
        take: pageSize,
        offset: currentPage.value * pageSize,
      },
    }),
  {
    watch: [activePub, currentPage],
    default: () => ({ posts: [], total: 0 }),
  },
);

const posts = computed(() => data.value?.posts ?? []);
const total = computed(() => data.value?.total ?? 0);
const maxPage = computed(() =>
  Math.max(Math.ceil(total.value / pageSize) - 1, 0),
);

const visiblePages = computed(() => {
  const start = Math.max(currentPage.value - 2, 0);
  const end = Math.min(start + 4, maxPage.value);
  const first = Math.max(end - 4, 0);
  return Array.from({ length: end - first + 1 }, (_, i) => first + i);
});

async function setPublisher(next: PublisherName) {
  await router.replace({ query: { ...route.query, pub: next, page: 0 } });
}

async function setPage(next: number) {
  const page = Math.min(Math.max(next, 0), maxPage.value);
  await router.replace({
    query: { ...route.query, pub: activePub.value, page },
  });
}

useHead({
  title: "文章",
  meta: [
    {
      name: "description",
      content: "分页浏览 littlesheep 的所有技术博客文章。",
    },
    { property: "og:title", content: "文章 - Goatshed" },
    {
      property: "og:description",
      content: "分页浏览 littlesheep 的所有技术博客文章。",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>
