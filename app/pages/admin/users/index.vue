<template>
    <div>
        <h1 class="mb-4 text-xl font-bold md:mb-6 md:text-2xl">用户管理</h1>

        <div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>用户</th>
                        <th>邮箱</th>
                        <th>管理员</th>
                        <th>Solar Token</th>
                        <th>注册时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="u in users" :key="u.id">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="avatar">
                                    <div class="h-8 w-8 rounded-full">
                                        <img
                                            v-if="u.image"
                                            :src="u.image"
                                            :alt="u.name"
                                        />
                                        <div
                                            v-else
                                            class="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-bold text-primary"
                                        >
                                            {{ u.name?.slice(0, 1).toUpperCase() }}
                                        </div>
                                    </div>
                                </div>
                                <span class="font-medium">{{ u.name }}</span>
                            </div>
                        </td>
                        <td class="text-sm text-base-content/70">{{ u.email }}</td>
                        <td>
                            <span v-if="u.isAdmin" class="badge badge-success">是</span>
                            <span v-else class="badge badge-ghost">否</span>
                        </td>
                        <td>
                            <div class="flex items-center gap-1">
                                <button
                                    v-if="!tokenCache[u.id]"
                                    class="btn btn-ghost btn-xs"
                                    :disabled="loadingToken === u.id"
                                    @click="fetchToken(u.id)"
                                >
                                    <KeyRound class="h-3 w-3" />
                                    <Loader2 v-if="loadingToken === u.id" class="h-3 w-3 animate-spin" />
                                    <span v-else>查看</span>
                                </button>
                                <template v-else>
                                    <span
                                        v-if="!tokenCache[u.id]?.hasToken"
                                        class="badge badge-ghost badge-xs"
                                    >无</span>
                                    <span
                                        v-else-if="tokenCache[u.id]?.needsRefresh"
                                        class="badge badge-warning badge-xs"
                                    >需刷新</span>
                                    <span
                                        v-else
                                        class="badge badge-success badge-xs"
                                    >有效</span>
                                    <button
                                        v-if="tokenCache[u.id]?.accessToken"
                                        class="btn btn-ghost btn-xs"
                                        title="复制 Token"
                                        @click="copyToken(u.id)"
                                    >
                                        <Check v-if="copiedId === u.id" class="h-3 w-3 text-success" />
                                        <Copy v-else class="h-3 w-3" />
                                    </button>
                                </template>
                            </div>
                        </td>
                        <td class="text-sm text-base-content/60">{{ formatDate(u.createdAt) }}</td>
                        <td>
                            <div class="flex gap-1">
                                <button
                                    class="btn btn-ghost btn-xs"
                                    title="看板管理"
                                    @click="openBoard(u)"
                                >
                                    <LayoutGrid class="h-3 w-3" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-xs"
                                    @click="editUser(u)"
                                >
                                    <Pencil class="h-3 w-3" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-xs text-error"
                                    @click="deleteUser(u)"
                                >
                                    <Trash2 class="h-3 w-3" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="users.length === 0" class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
            <Users class="mx-auto h-12 w-12 text-base-content/30" />
            <p class="mt-2 text-base-content/50">暂无用户</p>
        </div>

        <div v-if="totalPages > 1" class="mt-4 flex justify-center">
            <div class="join">
                <button class="btn join-item btn-sm" :disabled="page <= 1" @click="page--; refresh()">上一页</button>
                <span class="btn join-item btn-sm btn-ghost">{{ page }} / {{ totalPages }}</span>
                <button class="btn join-item btn-sm" :disabled="page >= totalPages" @click="page++; refresh()">下一页</button>
            </div>
        </div>

        <dialog ref="editDialog" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold">编辑用户</h3>
                <div class="mt-4 space-y-4">
                    <div class="form-control">
                        <label class="label"><span class="label-text">名称</span></label>
                        <input v-model="editForm.name" type="text" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label"><span class="label-text">邮箱</span></label>
                        <input v-model="editForm.email" type="email" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text">管理员</span>
                            <input v-model="editForm.isAdmin" type="checkbox" class="toggle toggle-primary" />
                        </label>
                    </div>
                </div>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost">取消</button>
                    </form>
                    <button class="btn btn-primary" :disabled="isSaving" @click="saveUser">
                        <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
                        保存
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
                <p class="py-4">确定要删除用户 <strong>{{ deletingUser?.name }}</strong> 吗？此操作不可撤销。</p>
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

        <!-- Board Management Dialog -->
        <dialog ref="boardDialog" class="modal">
            <div class="modal-box max-w-2xl">
                <h3 class="text-lg font-bold">看板管理 — {{ boardUser?.name }}</h3>
                <p class="mt-1 text-sm text-base-content/60">管理用户的个人主页组件</p>

                <div v-if="boardLoading" class="flex items-center justify-center py-8">
                    <Loader class="h-6 w-6 animate-spin text-base-content/40" />
                </div>

                <div v-else-if="boardError" class="mt-4">
                    <div class="alert alert-error">
                        <AlertCircle class="h-4 w-4" />
                        <span>{{ boardError }}</span>
                    </div>
                </div>

                <div v-else class="mt-4 space-y-3">
                    <div v-if="boardItems.length === 0" class="rounded-lg border border-base-300 bg-base-50 p-8 text-center">
                        <LayoutGrid class="mx-auto h-8 w-8 text-base-content/30" />
                        <p class="mt-2 text-sm text-base-content/50">该用户暂无看板组件</p>
                    </div>

                    <div
                        v-for="item in boardItems"
                        :key="item.id"
                        class="rounded-lg border border-base-300 bg-base-100 p-4"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">{{ getWidgetDisplayName(item) }}</span>
                                    <span class="badge badge-xs" :class="item.kind === 'custom_app' ? 'badge-info' : 'badge-ghost'">
                                        {{ getWidgetKindLabel(item) }}
                                    </span>
                                    <span v-if="!item.is_enabled" class="badge badge-warning badge-xs">已禁用</span>
                                </div>
                                <div class="mt-2 space-y-1">
                                    <div
                                        v-for="(field, fieldName) in item.payload"
                                        :key="fieldName"
                                        class="flex items-center gap-2 text-sm"
                                    >
                                        <span class="text-base-content/50">{{ field.label || fieldName }}:</span>
                                        <span class="font-mono text-xs text-base-content/70 truncate max-w-xs">{{ field.value ?? '—' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-1">
                                <button
                                    class="btn btn-ghost btn-xs"
                                    title="编辑载荷"
                                    @click="openEditPayload(item)"
                                >
                                    <Pencil class="h-3 w-3" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-xs text-error"
                                    title="移除组件"
                                    @click="removeBoardItem(item)"
                                >
                                    <Trash class="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost">关闭</button>
                    </form>
                    <button class="btn btn-ghost" :disabled="boardLoading" @click="fetchBoard">
                        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': boardLoading }" />
                        刷新
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
            </form>
        </dialog>

        <!-- Edit Payload Dialog -->
        <dialog ref="payloadEditDialog" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold">编辑组件载荷</h3>
                <p class="mt-1 text-sm text-base-content/60">{{ editingItem ? getWidgetDisplayName(editingItem) : '' }}</p>

                <div class="mt-4 space-y-4">
                    <div v-for="(field, fieldName) in editingItem?.payload" :key="fieldName" class="form-control">
                        <label class="label"><span class="label-text">{{ field.label || fieldName }}</span></label>
                        <input
                            v-model="payloadForm[fieldName]"
                            type="text"
                            :placeholder="field.label || fieldName"
                            class="input input-bordered"
                        />
                    </div>
                </div>

                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost">取消</button>
                    </form>
                    <button class="btn btn-primary" :disabled="boardSaving" @click="savePayload">
                        <Loader2 v-if="boardSaving" class="h-4 w-4 animate-spin" />
                        保存
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { Users, Pencil, Trash2, Loader2, KeyRound, Copy, Check, RefreshCw, LayoutGrid, Plus, Trash, AlertCircle, Loader } from "lucide-vue-next";

useHead({ title: "Admin - 用户管理" });

// ── Board Management ──

interface BoardItem {
    id: string;
    order: number;
    kind: string;
    widget_key: string | null;
    custom_app_id: string | null;
    custom_app_widget_key: string | null;
    is_enabled: boolean;
    payload: Record<string, any>;
}

const boardDialog = ref<HTMLDialogElement>();
const boardUser = ref<any>(null);
const boardItems = ref<BoardItem[]>([]);
const boardLoading = ref(false);
const boardError = ref<string | null>(null);
const boardSaving = ref(false);

function openBoard(user: any) {
    boardUser.value = user;
    boardItems.value = [];
    boardError.value = null;
    boardDialog.value?.showModal();
    fetchBoard();
}

async function fetchBoard() {
    if (!boardUser.value) return;
    boardLoading.value = true;
    boardError.value = null;
    try {
        const data = await $fetch<BoardItem[]>(`/api/admin/users/${boardUser.value.id}/board`);
        boardItems.value = data;
    } catch (e: any) {
        boardError.value = e.data?.message || e.message || "加载失败";
    } finally {
        boardLoading.value = false;
    }
}

function getFieldValue(item: BoardItem, fieldName: string): string {
    const field = item.payload?.[fieldName];
    if (field && typeof field === "object" && "value" in field) {
        return String(field.value ?? "");
    }
    return "";
}

function getFieldLabel(item: BoardItem, fieldName: string): string {
    const field = item.payload?.[fieldName];
    if (field && typeof field === "object" && "label" in field) {
        return String(field.label ?? fieldName);
    }
    return fieldName;
}

function getWidgetDisplayName(item: BoardItem): string {
    if (item.kind === "custom_app") {
        return item.custom_app_widget_key || item.custom_app_id || "Custom Widget";
    }
    return item.widget_key || "Unknown";
}

function getWidgetKindLabel(item: BoardItem): string {
    return item.kind === "custom_app" ? "应用组件" : "内置";
}

const payloadForm = reactive<Record<string, string>>({});
const editingItem = ref<BoardItem | null>(null);
const payloadEditDialog = ref<HTMLDialogElement>();

function openEditPayload(item: BoardItem) {
    editingItem.value = item;
    for (const key of Object.keys(payloadForm)) {
        delete payloadForm[key];
    }
    for (const [key, val] of Object.entries(item.payload || {})) {
        payloadForm[key] = getFieldValue(item, key);
    }
    payloadEditDialog.value?.showModal();
}

async function savePayload() {
    if (!editingItem.value || !boardUser.value) return;
    boardSaving.value = true;
    try {
        const payload: Record<string, any> = {};
        for (const item of boardItems.value) {
            if (item.id === editingItem.value!.id) {
                for (const [key, val] of Object.entries(payloadForm)) {
                    payload[key] = {
                        value: val,
                        label: getFieldLabel(editingItem.value!, key),
                    };
                }
            }
        }

        await $fetch(
            `/api/admin/users/${boardUser.value.id}/board/items/${editingItem.value.id}/payload`,
            {
                method: "POST",
                body: { payload },
            },
        );

        payloadEditDialog.value?.close();
        await fetchBoard();
    } catch (e: any) {
        alert(e.data?.message || e.message || "保存失败");
    } finally {
        boardSaving.value = false;
    }
}

async function removeBoardItem(item: BoardItem) {
    if (!boardUser.value) return;
    if (!confirm(`确定要移除组件 "${getWidgetDisplayName(item)}" 吗？`)) return;

    try {
        await $fetch(
            `/api/admin/users/${boardUser.value.id}/board/items/${item.id}`,
            { method: "DELETE" },
        );
        await fetchBoard();
    } catch (e: any) {
        alert(e.data?.message || e.message || "移除失败");
    }
}

definePageMeta({
    layout: "admin",
    middleware: ["auth"],
});

interface TokenInfo {
    hasToken: boolean;
    needsRefresh: boolean;
    accessToken: string | null;
    expiresAt: string | null;
    refreshTokenExpiresAt: string | null;
}

const tokenCache = ref<Record<string, TokenInfo>>({});
const loadingToken = ref<string | null>(null);
const copiedId = ref<string | null>(null);

async function fetchToken(userId: string) {
    loadingToken.value = userId;
    try {
        const data = await $fetch<TokenInfo>(`/api/admin/users/${userId}/token`);
        tokenCache.value[userId] = data;
    } catch {
        tokenCache.value[userId] = { hasToken: false, needsRefresh: true, accessToken: null, expiresAt: null, refreshTokenExpiresAt: null };
    } finally {
        loadingToken.value = null;
    }
}

function copyToken(userId: string) {
    const token = tokenCache.value[userId]?.accessToken;
    if (!token) return;
    navigator.clipboard.writeText(token);
    copiedId.value = userId;
    setTimeout(() => {
        if (copiedId.value === userId) copiedId.value = null;
    }, 2000);
}

const LIMIT = 20;
const users = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const editDialog = ref<HTMLDialogElement>();
const deleteDialog = ref<HTMLDialogElement>();
const editingUser = ref<any>(null);
const deletingUser = ref<any>(null);
const editForm = reactive({ name: "", email: "", isAdmin: false });
const isSaving = ref(false);
const isDeleting = ref(false);

const totalPages = computed(() => Math.ceil(total.value / LIMIT));

async function fetchUsers() {
    const params = new URLSearchParams({ page: String(page.value), limit: String(LIMIT) });
    const data = await $fetch(`/api/admin/users?${params.toString()}`);
    users.value = data.users;
    total.value = data.total;
}

const refresh = ref<(() => void) | null>(null);

function debounceFetch() {
    if (refresh.value) return;
    refresh.value = () => {
        fetchUsers();
        refresh.value = null;
    };
    setTimeout(refresh.value, 200);
}

onMounted(fetchUsers);

function editUser(user: any) {
    editingUser.value = user;
    editForm.name = user.name;
    editForm.email = user.email;
    editForm.isAdmin = user.isAdmin;
    editDialog.value?.showModal();
}

function deleteUser(user: any) {
    deletingUser.value = user;
    deleteDialog.value?.showModal();
}

async function saveUser() {
    if (!editingUser.value) return;
    isSaving.value = true;
    try {
        await $fetch(`/api/admin/users/${editingUser.value.id}`, { method: "PATCH", body: editForm });
        editDialog.value?.close();
        await fetchUsers();
    } finally {
        isSaving.value = false;
    }
}

async function confirmDelete() {
    if (!deletingUser.value) return;
    isDeleting.value = true;
    try {
        await $fetch(`/api/admin/users/${deletingUser.value.id}`, { method: "DELETE" });
        deleteDialog.value?.close();
        await fetchUsers();
    } finally {
        isDeleting.value = false;
    }
}

function formatDate(date: string | Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

useHead({ title: "Admin - 用户管理" });
</script>
