<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-3xl">
            <div class="mb-6">
                <h1 class="text-2xl font-bold">麻将</h1>
                <p class="mt-1 text-sm text-base-content/60">加入麻将场次，消耗陪玩票选择倍率入场</p>
            </div>

            <div class="mb-6 rounded-xl border border-base-300 bg-base-100 p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <Ticket class="h-5 w-5 text-primary" />
                        <div>
                            <div class="text-sm text-base-content/60">我的陪玩票</div>
                            <div class="text-2xl font-bold text-primary">
                                {{ ticketBalance.available }}
                                <span class="text-sm font-normal text-base-content/50">可用</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right text-xs text-base-content/40">
                        共 {{ ticketBalance.total }} 张 · 已用 {{ ticketBalance.used }} 张
                    </div>
                </div>
            </div>

            <div v-if="sessions.length > 0" class="space-y-4">
                <div
                    v-for="s in sessions"
                    :key="s.id"
                    class="rounded-xl border border-base-300 bg-base-100 p-5"
                >
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-lg font-bold">{{ s.name }}</h2>
                                <span :class="['badge badge-xs', getStatusBadge(s.status)]">
                                    {{ getStatusLabel(s.status) }}
                                </span>
                            </div>
                            <p v-if="s.description" class="mt-1 text-sm text-base-content/60">{{ s.description }}</p>
                            <div class="mt-2 flex flex-wrap gap-3 text-xs text-base-content/50">
                                <span>{{ s.playerCount }}人场</span>
                                <span>初始 {{ s.initialPoints.toLocaleString() }} 点</span>
                                <span>{{ s.multiplier }}x 倍率</span>
                                <span>入场费 {{ s.multiplier * s.ticketValue }} pts / 人</span>
                            </div>
                        </div>
                        <span class="badge badge-info shrink-0">{{ s.multiplier }} 张票</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-sm text-base-content/50">
                        <span>{{ s.participantCount }}/{{ s.playerCount }} 人已加入</span>
                        <button
                            class="btn btn-primary btn-sm"
                            :disabled="joiningId === s.id || ticketBalance.available < s.multiplier || s.participantCount >= s.playerCount"
                            :title="ticketBalance.available < s.multiplier ? '票数不足' : s.participantCount >= s.playerCount ? '已满员' : ''"
                            @click="joinSession(s)"
                        >
                            <Loader2 v-if="joiningId === s.id" class="h-4 w-4 animate-spin" />
                            {{ s.participantCount >= s.playerCount ? '已满员' : ticketBalance.available < s.multiplier ? '票数不足' : '加入' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="!isLoading" class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Gamepad2 class="mx-auto h-12 w-12 text-base-content/20" />
                <p class="mt-2 text-base-content/50">暂无麻将场次</p>
                <NuxtLink to="/store/buy/gaming" class="btn btn-primary btn-sm mt-4">购买陪玩票</NuxtLink>
            </div>

            <div v-else class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
                <p class="mt-2 text-base-content/50">加载中...</p>
            </div>
        </div>

        <dialog ref="resultDialog" class="modal">
            <div class="modal-box max-w-sm text-center">
                <div
                    v-if="joinResult"
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
                >
                    <Check class="h-8 w-8 text-success" />
                </div>
                <div
                    v-else
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/20"
                >
                    <X class="h-8 w-8 text-error" />
                </div>
                <h3 class="mt-4 text-lg font-bold">
                    {{ joinResult ? "加入成功！" : "加入失败" }}
                </h3>
                <p class="mt-2 text-sm text-base-content/60">
                    {{ joinMessage }}
                </p>
                <div class="modal-action justify-center">
                    <form method="dialog">
                        <button class="btn">关闭</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
            </form>
        </dialog>
    </main>
</template>

<script setup lang="ts">
import { Gamepad2, Loader2, Check, X, Ticket } from "lucide-vue-next";

definePageMeta({
    middleware: ["auth"],
});

interface MahjongSession {
    id: string;
    name: string;
    description: string | null;
    playerCount: number;
    initialPoints: number;
    ticketValue: number;
    multiplier: number;
    status: string;
    createdAt: string;
    participantCount: number;
}

const sessions = ref<MahjongSession[]>([]);
const isLoading = ref(true);
const joiningId = ref<string | null>(null);
const resultDialog = ref<HTMLDialogElement>();
const joinResult = ref(false);
const joinMessage = ref("");
const ticketBalance = ref({ total: 0, used: 0, available: 0 });

async function fetchSessions() {
    isLoading.value = true;
    try {
        const [data, tickets] = await Promise.all([
            $fetch("/api/mahjong") as Promise<MahjongSession[]>,
            $fetch("/api/sessions/tickets") as Promise<{ total: number; used: number; available: number }>,
        ]);
        sessions.value = data;
        ticketBalance.value = tickets;
    } finally {
        isLoading.value = false;
    }
}

async function joinSession(s: MahjongSession) {
    joiningId.value = s.id;
    try {
        await $fetch(`/api/mahjong/${s.id}/join`, { method: "POST" });
        joinResult.value = true;
        joinMessage.value = `成功加入「${s.name}」！消耗了 ${s.multiplier} 张陪玩票。入场费：${s.multiplier * s.ticketValue} pts。`;
        resultDialog.value?.showModal();
        ticketBalance.value.available -= s.multiplier;
        ticketBalance.value.used += s.multiplier;
        await fetchSessions();
    } catch (e: any) {
        joinResult.value = false;
        joinMessage.value = e.data?.statusMessage || e.data?.message || "加入失败，请检查票数是否足够";
        resultDialog.value?.showModal();
    } finally {
        joiningId.value = null;
    }
}

onMounted(fetchSessions);

function getStatusBadge(status: string) {
    const map: Record<string, string> = { "upcoming": "badge-info", "ongoing": "badge-success", "ended": "badge-ghost" };
    return map[status] || "badge-ghost";
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = { "upcoming": "即将开始", "ongoing": "进行中", "ended": "已结束" };
    return map[status] || status;
}

useHead({ title: "麻将" });
</script>
