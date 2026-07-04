<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold">陪玩场次</h1>
            <button class="btn btn-primary btn-sm" @click="openCreate">
                <Plus class="h-4 w-4" />
                创建场次
            </button>
        </div>

        <div v-if="sessions.length > 0" class="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>名称</th>
                        <th>描述</th>
                        <th>状态</th>
                        <th>所需票数</th>
                        <th>已加入</th>
                        <th>创建时间</th>
                        <th class="text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in sessions" :key="s.id">
                        <td class="font-bold">{{ s.name }}</td>
                        <td class="max-w-48 truncate text-sm text-base-content/60">{{ s.description || "-" }}</td>
                        <td>
                            <select
                                :class="['select select-bordered select-xs w-24', getSessionStatusBadge(s.status)]"
                                :value="s.status || 'upcoming'"
                                @change="updateStatus(s, ($event.target as HTMLSelectElement).value)"
                            >
                                <option value="upcoming">即将开始</option>
                                <option value="ongoing">进行中</option>
                                <option value="ended">已结束</option>
                            </select>
                        </td>
                        <td>
                            <span class="badge badge-info">{{ s.ticketCost }} 张</span>
                        </td>
                        <td class="text-sm">{{ s.participantCount }} 人</td>
                        <td class="text-sm text-base-content/60">{{ formatDate(s.createdAt) }}</td>
                        <td>
                            <div class="flex justify-end gap-1">
                                <button
                                    class="btn btn-ghost btn-xs"
                                    title="删除"
                                    @click="deleteSession(s)"
                                >
                                    <Trash2 class="h-3 w-3 text-error" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
            <Gamepad2 class="mx-auto h-12 w-12 text-base-content/20" />
            <p class="mt-2 text-base-content/50">暂无陪玩场次</p>
        </div>
    </div>

    <dialog ref="createDialog" class="modal">
        <div class="modal-box max-w-md">
            <h3 class="text-lg font-bold">创建陪玩场次</h3>
            <div class="mt-4 space-y-4">
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">名称</legend>
                    <input v-model="form.name" class="input w-full" placeholder="例如：周末 Minecraft 联机" />
                </fieldset>
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">描述（可选）</legend>
                    <textarea v-model="form.description" class="textarea w-full" rows="2" maxlength="500" placeholder="活动详情..." />
                </fieldset>
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">所需票数</legend>
                    <input v-model.number="form.ticketCost" type="number" min="1" max="100" class="input w-32" />
                </fieldset>
            </div>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-ghost">取消</button>
                </form>
                <button class="btn btn-primary" :disabled="!form.name || isCreating" @click="createSession">
                    <Loader2 v-if="isCreating" class="h-4 w-4 animate-spin" />
                    创建
                </button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>关闭</button>
        </form>
    </dialog>

    <dialog ref="deleteDialog" class="modal">
        <div class="modal-box max-w-sm">
            <h3 class="text-lg font-bold">确认删除</h3>
            <p class="py-4 text-sm text-base-content/70">
                确定要删除「{{ selectedSession?.name }}」吗？此操作不可撤销。
            </p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-ghost">取消</button>
                </form>
                <button class="btn btn-error" :disabled="isDeleting" @click="confirmDelete">
                    <Loader2 v-if="isDeleting" class="h-4 w-4 animate-spin" />
                    删除
                </button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>关闭</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { Plus, Trash2, Gamepad2, Loader2 } from "lucide-vue-next";

definePageMeta({
    layout: "admin",
    middleware: ["auth"],
});

const sessions = ref<any[]>([]);
const isCreating = ref(false);
const isDeleting = ref(false);
const createDialog = ref<HTMLDialogElement>();
const deleteDialog = ref<HTMLDialogElement>();
const selectedSession = ref<any>(null);

const form = reactive({
    name: "",
    description: "",
    ticketCost: 1,
});

async function fetchSessions() {
    const data = await $fetch("/api/admin/sessions");
    sessions.value = data.sessions;
}

function openCreate() {
    form.name = "";
    form.description = "";
    form.ticketCost = 1;
    createDialog.value?.showModal();
}

async function createSession() {
    isCreating.value = true;
    try {
        await $fetch("/api/admin/sessions", {
            method: "POST",
            body: {
                name: form.name,
                description: form.description || undefined,
                ticketCost: form.ticketCost,
            },
        });
        createDialog.value?.close();
        await fetchSessions();
    } finally {
        isCreating.value = false;
    }
}

function deleteSession(s: any) {
    selectedSession.value = s;
    deleteDialog.value?.showModal();
}

async function confirmDelete() {
    if (!selectedSession.value) return;
    isDeleting.value = true;
    try {
        await $fetch(`/api/admin/sessions/${selectedSession.value.id}`, { method: "DELETE" });
        deleteDialog.value?.close();
        await fetchSessions();
    } finally {
        isDeleting.value = false;
    }
}

async function updateStatus(s: any, status: string) {
    await $fetch(`/api/admin/sessions/${s.id}`, { method: "PATCH", body: { status } });
    s.status = status;
}

function getSessionStatusBadge(status: string) {
    const map: Record<string, string> = { "upcoming": "select-info", "ongoing": "select-success", "ended": "" };
    return map[status] || "";
}

function formatDate(date: string | Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

onMounted(fetchSessions);
useHead({ title: "Admin - 陪玩场次" });
</script>
