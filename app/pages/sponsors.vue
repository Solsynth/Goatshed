<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-3xl">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
                <Trophy class="mx-auto h-10 w-10 text-primary" />
                <h1 class="mt-4 text-2xl font-black">打赏排行榜</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    感谢所有支持我的朋友 ❤️
                </p>

                <div
                    v-if="stats.total > 0"
                    class="mt-6 flex items-center justify-center gap-8"
                >
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary">{{ stats.total }}</div>
                        <div class="text-xs text-base-content/50">赞助次数</div>
                    </div>
                    <div class="h-8 w-px bg-base-300" />
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary">{{ stats.totalAmount }}</div>
                        <div class="text-xs text-base-content/50">总金额</div>
                    </div>
                </div>
            </div>

            <div v-if="topThree.length > 0" class="mt-8 grid grid-cols-3 gap-3">
                <div
                    v-for="(sponsor, i) in topThree"
                    :key="sponsor.id"
                    :class="[
                        'rounded-2xl border bg-base-100 p-4 text-center',
                        i === 0 ? 'border-warning ring-2 ring-warning/30 sm:-mt-4' : 'border-base-300',
                    ]"
                >
                    <div class="flex justify-center">
                        <div :class="['flex h-10 w-10 items-center justify-center rounded-full', podiumBg(i)]">
                            <component :is="podiumIcon(i)" class="h-5 w-5" />
                        </div>
                    </div>
                    <div class="avatar mt-2">
                        <div class="h-12 w-12 rounded-full ring-2 ring-offset-2 ring-offset-base-100" :class="ringColor(i)">
                            <img :src="sponsor.avatarUrl" :alt="sponsor.name" />
                        </div>
                    </div>
                    <div class="mt-2 truncate font-bold">{{ sponsor.name }}</div>
                    <div class="mt-1 text-sm font-semibold text-primary">
                        {{ sponsor.totalAmount }} {{ sponsor.currency }}
                    </div>
                    <div class="text-xs text-base-content/40">{{ sponsor.count }} 次</div>
                </div>
            </div>

            <div v-if="restSponsors.length > 0" class="mt-6 rounded-xl border border-base-300 bg-base-100 overflow-hidden">
                <table class="table table-zebra">
                    <thead>
                        <tr>
                            <th class="w-16 text-center">#</th>
                            <th>用户</th>
                            <th class="text-right">金额</th>
                            <th class="text-right">次数</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(sponsor, i) in restSponsors" :key="sponsor.id">
                            <td class="text-center font-bold text-base-content/40">{{ i + 4 }}</td>
                            <td>
                                <div class="flex items-center gap-2">
                                    <div class="avatar">
                                        <div class="h-8 w-8 rounded-full">
                                            <img :src="sponsor.avatarUrl" :alt="sponsor.name" />
                                        </div>
                                    </div>
                                    <span class="font-medium">{{ sponsor.name }}</span>
                                </div>
                            </td>
                            <td class="text-right font-semibold text-primary">
                                {{ sponsor.totalAmount }} {{ sponsor.currency }}
                            </td>
                            <td class="text-right text-sm text-base-content/50">{{ sponsor.count }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div
                v-else-if="topThree.length === 0 && !isLoading"
                class="mt-8 rounded-2xl border border-base-300 bg-base-100 p-12 text-center"
            >
                <Trophy class="mx-auto h-12 w-12 text-base-content/20" />
                <p class="mt-3 text-base-content/50">还没有赞助者，成为第一个上榜者吧！</p>
                <NuxtLink to="/store/buy?product=donation" class="btn btn-primary mt-4">前去打赏</NuxtLink>
            </div>

            <div v-if="hasMore" class="mt-6 text-center">
                <button class="btn btn-ghost" :disabled="isLoading" @click="loadMore">
                    <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
                    {{ isLoading ? "加载中..." : "加载更多" }}
                </button>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { Trophy, Medal, Award, Loader2 } from "lucide-vue-next";
import type { Component } from "vue";

interface LeaderboardEntry {
    id: string;
    name: string;
    avatarUrl: string;
    totalAmount: string;
    currency: string;
    count: number;
    remarks: string | null;
    lastPaidAt: string;
}

const leaderboard = ref<LeaderboardEntry[]>([]);
const isLoading = ref(false);
const hasMore = ref(false);
const offset = ref(0);
const LIMIT = 50;
const stats = ref({ total: 0, totalAmount: "0" });

const topThree = computed(() => leaderboard.value.slice(0, 3));
const restSponsors = computed(() => leaderboard.value.slice(3));

async function fetchLeaderboard() {
    isLoading.value = true;
    try {
        const data = await $fetch<{
            leaderboard: LeaderboardEntry[];
            total: number;
            totalAmount: string;
        }>("/api/donations/leaderboard", {
            query: { limit: LIMIT, offset: offset.value, productType: "donation" },
        });

        leaderboard.value.push(...data.leaderboard);
        stats.value = { total: data.total, totalAmount: data.totalAmount };
        hasMore.value = leaderboard.value.length < data.total;
        offset.value += LIMIT;
    } finally {
        isLoading.value = false;
    }
}

function loadMore() {
    fetchLeaderboard();
}

function podiumBg(index: number) {
    const colors = ["bg-warning text-warning-content", "bg-base-300 text-base-content", "bg-amber-700 text-amber-100"];
    return colors[index] || "bg-base-200";
}

function podiumIcon(index: number): Component {
    const icons = [Trophy, Medal, Award];
    return icons[index] || Medal;
}

function ringColor(index: number) {
    const colors = ["ring-warning", "ring-base-400", "ring-amber-600"];
    return colors[index] || "ring-base-300";
}

await fetchLeaderboard();

useHead({
    title: "打赏排行榜",
    meta: [
        { name: "description", content: "打赏排行榜 - 感谢所有支持者" },
        { property: "og:title", content: "打赏排行榜 - Goatshed" },
    ],
});
</script>
