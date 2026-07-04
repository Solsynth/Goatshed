<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-3xl">
            <div v-if="isLoading" class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
                <p class="mt-2 text-base-content/50">加载中...</p>
            </div>

            <template v-else-if="session">
                <div class="mb-6">
                    <NuxtLink to="/mahjong" class="btn btn-ghost btn-sm mb-4">
                        &larr; 返回列表
                    </NuxtLink>
                    <div class="flex items-center gap-2">
                        <h1 class="text-2xl font-bold">{{ session.name }}</h1>
                        <span :class="['badge', getStatusBadge(session.status)]">
                            {{ getStatusLabel(session.status) }}
                        </span>
                    </div>
                    <p v-if="session.description" class="mt-1 text-sm text-base-content/60">{{ session.description }}</p>
                </div>

                <div class="grid gap-6 lg:grid-cols-2">
                    <div class="rounded-xl border border-base-300 bg-base-100 p-6">
                        <h2 class="mb-4 text-lg font-bold">场次配置</h2>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">人数</span>
                                <span class="font-semibold">{{ session.playerCount }}人</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">初始点数</span>
                                <span class="font-semibold">{{ session.initialPoints.toLocaleString() }} 点</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">倍率</span>
                                <span class="font-semibold">{{ session.multiplier }}x</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">每票点数</span>
                                <span class="font-semibold">{{ session.ticketValue }} pts</span>
                            </div>
                            <hr class="border-base-300" />
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">每人入场费</span>
                                <span class="font-semibold text-primary">{{ session.entryFeeTickets }} 张票 = {{ session.perPersonEntryFee.toLocaleString() }} pts</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-base-content/60">全场总入场费</span>
                                <span class="font-semibold text-primary">{{ session.totalEntryFee.toLocaleString() }} pts</span>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-xl border border-base-300 bg-base-100 p-6">
                        <h2 class="mb-4 text-lg font-bold">
                            参与者
                            <span class="text-sm font-normal text-base-content/50">（{{ session.participants.length }}/{{ session.playerCount }}）</span>
                        </h2>
                        <div v-if="session.participants.length > 0" class="space-y-3">
                            <div
                                v-for="p in session.participants"
                                :key="p.id"
                                class="flex items-center gap-3 rounded-lg bg-base-200 p-3"
                            >
                                <div class="avatar placeholder shrink-0">
                                    <div class="w-9 rounded-full bg-neutral text-neutral-content">
                                        <span class="text-xs">{{ (p.userNick || p.userName || "?").charAt(0) }}</span>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="truncate text-sm font-semibold">{{ p.userNick || p.userName || "未知用户" }}</div>
                                    <div class="text-xs text-base-content/50">
                                        消耗 {{ p.ticketsUsed }} 张票 · {{ formatDate(p.joinedAt) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="py-8 text-center text-sm text-base-content/50">
                            暂无参与者
                        </div>
                    </div>
                </div>
            </template>

            <div v-else class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <p class="text-base-content/50">场次不存在</p>
                <NuxtLink to="/mahjong" class="btn btn-primary btn-sm mt-4">返回列表</NuxtLink>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";

definePageMeta({
    middleware: ["auth"],
});

const route = useRoute();
const session = ref<any>(null);
const isLoading = ref(true);

onMounted(async () => {
    try {
        session.value = await $fetch(`/api/mahjong/${route.params.id}`);
    } finally {
        isLoading.value = false;
    }
});

function getStatusBadge(status: string) {
    const map: Record<string, string> = { "upcoming": "badge-info", "ongoing": "badge-success", "ended": "badge-ghost" };
    return map[status] || "badge-ghost";
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = { "upcoming": "即将开始", "ongoing": "进行中", "ended": "已结束" };
    return map[status] || status;
}

function formatDate(date: string | Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

useHead({ title: session.value?.name || "麻将场次" });
</script>
