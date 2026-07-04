<template>
  <div class="reaction-bar flex items-center gap-1.5 flex-wrap">
    <div
      v-for="reaction in displayReactions"
      :key="reaction.symbol"
      class="reaction-chip"
    >
      <button
        class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all duration-150"
        :class="reaction.reacted
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-base-300/40 bg-base-100 text-base-content/70 hover:border-primary/30 hover:bg-primary/5'"
        :disabled="toggling"
        @click="toggleReaction(reaction)"
      >
        <span>{{ symbolToEmoji(reaction.symbol) }}</span>
        <span class="font-medium">{{ reaction.count }}</span>
      </button>
    </div>

    <div v-if="authenticated" class="relative reaction-picker-wrap">
      <button
        class="inline-flex items-center justify-center rounded-full border border-base-300/40 bg-base-100 px-2 py-1 text-base-content/50 transition-colors hover:border-primary/30 hover:text-primary"
        :class="{ 'border-primary/40 text-primary': pickerOpen }"
        @click="pickerOpen = !pickerOpen"
      >
        <Plus class="h-3.5 w-3.5" />
      </button>

      <div
        v-if="pickerOpen"
        class="absolute bottom-full left-0 mb-2 z-50 rounded-xl border border-base-300/40 bg-base-100 p-2 shadow-lg"
      >
        <div class="grid grid-cols-3 gap-1">
          <button
            v-for="opt in availableReactions"
            :key="opt.symbol"
            class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors hover:bg-base-200"
            :title="opt.label"
            @click="addReaction(opt.symbol); pickerOpen = false"
          >
            <span class="text-lg leading-none">{{ opt.emoji }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReactionSummary } from "~/types/comment";
import { Plus } from "lucide-vue-next";

const props = defineProps<{
  postId: string;
}>();

const { authenticated } = useAuth();

const reactions = ref<ReactionSummary[]>([]);
const total = ref(0);
const toggling = ref(false);
const pickerOpen = ref(false);

const availableReactions = [
  { symbol: "thumb_up", emoji: "👍", label: "赞" },
  { symbol: "heart", emoji: "❤️", label: "爱心" },
  { symbol: "clap", emoji: "👏", label: "鼓掌" },
  { symbol: "party", emoji: "🎉", label: "庆祝" },
  { symbol: "laugh", emoji: "😂", label: "哈哈" },
  { symbol: "cry", emoji: "😢", label: "哭泣" },
  { symbol: "angry", emoji: "😠", label: "生气" },
  { symbol: "confuse", emoji: "😕", label: "困惑" },
  { symbol: "pray", emoji: "🙏", label: "祈祷" },
];

const displayReactions = computed(() =>
  reactions.value.filter((r) => r.count > 0),
);

function symbolToEmoji(symbol: string): string {
  const found = availableReactions.find((r) => r.symbol === symbol);
  return found?.emoji || "👍";
}

async function fetchReactions() {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions`,
    );
    reactions.value = data.reactions;
    total.value = data.total;
  } catch (e) {
    console.error("Failed to fetch reactions:", e);
  }
}

async function toggleReaction(reaction: ReactionSummary) {
  if (!authenticated.value || toggling.value) return;
  toggling.value = true;

  if (reaction.reacted) {
    await removeReaction(reaction.symbol);
  } else {
    await addReaction(reaction.symbol);
  }

  toggling.value = false;
}

async function addReaction(symbol: string) {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions`,
      { method: "POST", body: { symbol } },
    );
    reactions.value = data.reactions;
    total.value = data.total;
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    if (err.statusCode === 409) {
      await fetchReactions();
    } else if (err.statusCode !== 401 && err.statusCode !== 403) {
      console.error("Failed to add reaction:", e);
    }
  }
}

async function removeReaction(symbol: string) {
  try {
    const data = await $fetch<{ reactions: ReactionSummary[]; total: number }>(
      `/api/posts/${props.postId}/reactions/${symbol}`,
      { method: "DELETE" },
    );
    reactions.value = data.reactions;
    total.value = data.total;
  } catch (e) {
    console.error("Failed to remove reaction:", e);
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.reaction-picker-wrap')) {
    pickerOpen.value = false
  }
}

onMounted(() => {
  fetchReactions()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
