<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="publisher in publishers"
      :key="publisher"
      class="inline-flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs transition-colors"
      :class="active === publisher
        ? 'border-primary/60 bg-primary/15 text-primary'
        : 'border-base-300/70 bg-base-100 text-base-content/75 hover:border-primary/40 hover:text-primary'"
      @click="onPublisherClick(publisher)"
    >
      <span class="inline-block h-5 w-5 shrink-0 overflow-hidden rounded-full border border-base-300/70 bg-base-200">
        <img
          v-if="publisherAvatar(publisher)"
          :src="publisherAvatar(publisher)"
          :alt="publisherLabel(publisher)"
          class="block h-full w-full object-cover"
          loading="lazy"
        >
        <span v-else class="flex h-full w-full items-center justify-center text-[10px] font-bold">
          {{ publisherLabel(publisher).slice(0, 1).toUpperCase() }}
        </span>
      </span>

      <span class="min-w-0 text-left">
        <span class="inline-flex items-center gap-1.5 font-semibold">
          <span>{{ publisherLabel(publisher) }}</span>
          <Lock v-if="publisherMeta[publisher].locked" class="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
        </span>
        <span class="mt-0.5 block text-[11px] opacity-70">
          {{ publisherMeta[publisher].description }}
          <template v-if="publisherMeta[publisher].locked"> 需要登录。</template>
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Lock } from "lucide-vue-next";
import type { PublisherName } from "~/constants/publishers";
import type { Publisher } from "~/types/publisher";

const props = defineProps<{
  publishers: readonly PublisherName[];
  active: PublisherName;
}>();

const emit = defineEmits<{
  change: [value: PublisherName];
}>();

const config = useRuntimeConfig();
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const publisherData = await $fetch<Record<string, Publisher | null>>('/api/publishers');
const publisherEntries = props.publishers.map((name) => [name, publisherData[name] ?? null] as const);

const publisherMap = Object.fromEntries(publisherEntries) as Record<PublisherName, Publisher | null>;

const publisherMeta: Record<PublisherName, { description: string; locked: boolean }> = {
  littlesheep: {
    description: "技术博客",
    locked: false,
  },
  littlesheep0v0: {
    description: "生活随记",
    locked: false,
  },
  littlesheepuwu: {
    description: "私密生活随记",
    locked: true,
  },
};

function publisherLabel(name: PublisherName) {
  return publisherMap[name]?.nick || publisherMap[name]?.name || name;
}

function publisherAvatar(name: PublisherName) {
  const picture = publisherMap[name]?.picture;
  if (!picture?.id) return "";
  return picture.url || `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(picture.id)}`;
}

function onPublisherClick(name: PublisherName) {
  if (publisherMeta[name].locked && !auth.authenticated.value) {
    const next = router.resolve({
      path: route.path,
      query: { ...route.query, pub: name },
    }).fullPath;
    auth.login(next);
    return;
  }
  emit("change", name);
}
</script>
