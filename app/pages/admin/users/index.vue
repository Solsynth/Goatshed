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
                <button class="btn join-item btn-sm" :disabled="page <= 1" @click="page--; fetchUsers()">上一页</button>
                <span class="btn join-item btn-sm btn-ghost">{{ page }} / {{ totalPages }}</span>
                <button class="btn join-item btn-sm" :disabled="page >= totalPages" @click="page++; fetchUsers()">下一页</button>
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
                <p class="mt-1 text-sm text-base-content/60">
                    查看 / 调整用户看板；自定义应用载荷通过应用 private API 推送
                </p>

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
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="font-medium">{{ getWidgetDisplayName(item) }}</span>
                                    <span
                                        class="badge badge-xs"
                                        :class="item.kind === 'custom_app' ? 'badge-info' : 'badge-ghost'"
                                    >
                                        {{ getWidgetKindLabel(item) }}
                                    </span>
                                    <span v-if="!item.is_enabled" class="badge badge-warning badge-xs">已禁用</span>
                                    <span class="badge badge-ghost badge-xs">#{{ item.order }}</span>
                                </div>
                                <p v-if="item.kind === 'custom_app'" class="mt-1 truncate font-mono text-xs text-base-content/40">
                                    {{ item.custom_app_id }} · {{ item.custom_app_widget_key }}
                                </p>
                                <div class="mt-2 space-y-1">
                                    <template v-if="hasPayloadFields(item)">
                                        <div
                                            v-for="(field, fieldName) in item.payload"
                                            :key="String(fieldName)"
                                            class="flex items-start gap-2 text-sm"
                                        >
                                            <span class="shrink-0 text-base-content/50">
                                                {{ getFieldLabel(item, String(fieldName)) }}:
                                            </span>
                                            <span class="truncate font-mono text-xs text-base-content/70">
                                                {{ formatFieldValue(item, String(fieldName)) }}
                                            </span>
                                            <span
                                                v-if="getFieldFormat(item, String(fieldName))"
                                                class="badge badge-ghost badge-xs shrink-0"
                                            >
                                                {{ getFieldFormat(item, String(fieldName)) }}
                                            </span>
                                        </div>
                                    </template>
                                    <p v-else class="text-xs text-base-content/40">
                                        {{ item.kind === 'custom_app' ? '载荷为空（等待应用推送或管理员覆盖）' : '暂无载荷字段' }}
                                    </p>
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
            <div class="modal-box max-w-xl">
                <h3 class="text-lg font-bold">编辑组件载荷</h3>
                <p class="mt-1 text-sm text-base-content/60">
                    {{ editingItem ? getWidgetDisplayName(editingItem) : '' }}
                </p>
                <p class="mt-1 text-xs text-base-content/40">
                    字段需符合通用信封：value + label，format 可选
                </p>

                <div class="mt-3 flex items-center gap-2">
                    <button
                        type="button"
                        class="btn btn-xs"
                        :class="payloadEditMode === 'fields' ? 'btn-primary' : 'btn-ghost'"
                        @click="payloadEditMode = 'fields'"
                    >
                        字段
                    </button>
                    <button
                        type="button"
                        class="btn btn-xs"
                        :class="payloadEditMode === 'json' ? 'btn-primary' : 'btn-ghost'"
                        @click="switchToJsonMode"
                    >
                        JSON
                    </button>
                </div>

                <div v-if="payloadEditMode === 'fields'" class="mt-4 space-y-4">
                    <div v-if="payloadFieldKeys.length === 0" class="rounded-lg border border-dashed border-base-300 p-4 text-center text-sm text-base-content/50">
                        当前无字段，可添加字段或切换到 JSON 编辑
                    </div>

                    <div v-for="key in payloadFieldKeys" :key="key" class="rounded-lg border border-base-300 p-3">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <span class="font-mono text-xs text-base-content/60">{{ key }}</span>
                            <button type="button" class="btn btn-ghost btn-xs text-error" @click="removePayloadField(key)">
                                移除
                            </button>
                        </div>
                        <div class="space-y-2">
                            <div class="form-control">
                                <label class="label py-0"><span class="label-text text-xs">Label</span></label>
                                <input v-model="payloadFields[key]!.label" type="text" class="input input-bordered input-sm" />
                            </div>
                            <div class="form-control">
                                <label class="label py-0"><span class="label-text text-xs">Value</span></label>
                                <input v-model="payloadFields[key]!.value" type="text" class="input input-bordered input-sm" />
                            </div>
                            <div class="form-control">
                                <label class="label py-0"><span class="label-text text-xs">Format（可选）</span></label>
                                <input
                                    v-model="payloadFields[key]!.format"
                                    type="text"
                                    placeholder="boolean / number / date / currency …"
                                    class="input input-bordered input-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-base-300 p-3">
                        <div class="form-control min-w-[8rem] flex-1">
                            <label class="label py-0"><span class="label-text text-xs">新字段名</span></label>
                            <input v-model="newFieldName" type="text" placeholder="field_key" class="input input-bordered input-sm" />
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" @click="addPayloadField">
                            <Plus class="h-3 w-3" />
                            添加字段
                        </button>
                    </div>
                </div>

                <div v-else class="mt-4">
                    <textarea
                        v-model="payloadJsonText"
                        class="textarea textarea-bordered h-64 w-full font-mono text-xs"
                        spellcheck="false"
                        placeholder='{\n  "title": { "value": "…", "label": "Title" }\n}'
                    />
                    <p v-if="payloadJsonError" class="mt-2 text-xs text-error">{{ payloadJsonError }}</p>
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
// Layout: user self-board (Passport). Custom-app payload: app private API.
// Payload envelope: { value, label, format? }

interface BoardPayloadField {
    value: unknown;
    label: string;
    format?: string;
}

interface BoardItem {
    id: string;
    order: number;
    kind: string;
    widget_key: string | null;
    custom_app_id: string | null;
    custom_app_widget_key: string | null;
    is_enabled: boolean;
    payload: Record<string, BoardPayloadField | unknown> | null;
}

interface EditablePayloadField {
    label: string;
    value: string;
    format: string;
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
        boardItems.value = Array.isArray(data) ? data : [];
    } catch (e: any) {
        boardError.value = e.data?.message || e.message || "加载失败";
    } finally {
        boardLoading.value = false;
    }
}

function isEnvelopeField(field: unknown): field is BoardPayloadField {
    return !!field && typeof field === "object" && "value" in field && "label" in field;
}

function getFieldValue(item: BoardItem, fieldName: string): unknown {
    const field = item.payload?.[fieldName];
    if (isEnvelopeField(field)) return field.value;
    return field ?? "";
}

function getFieldLabel(item: BoardItem, fieldName: string): string {
    const field = item.payload?.[fieldName];
    if (isEnvelopeField(field) && field.label) return String(field.label);
    return fieldName;
}

function getFieldFormat(item: BoardItem, fieldName: string): string {
    const field = item.payload?.[fieldName];
    if (isEnvelopeField(field) && field.format) return String(field.format);
    return "";
}

function formatFieldValue(item: BoardItem, fieldName: string): string {
    const value = getFieldValue(item, fieldName);
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

function hasPayloadFields(item: BoardItem): boolean {
    return !!item.payload && Object.keys(item.payload).length > 0;
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

function coerceFieldValue(raw: string, format?: string): unknown {
    const trimmed = raw.trim();
    const fmt = (format || "").toLowerCase();

    if (fmt === "boolean") {
        if (["true", "1", "yes", "y"].includes(trimmed.toLowerCase())) return true;
        if (["false", "0", "no", "n"].includes(trimmed.toLowerCase())) return false;
        return trimmed;
    }

    if (fmt === "number") {
        if (trimmed === "") return null;
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : trimmed;
    }

    if (
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
        || (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return raw;
        }
    }

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;

    return raw;
}

function valueToEditString(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

const payloadFields = reactive<Record<string, EditablePayloadField>>({});
const payloadFieldKeys = computed(() => Object.keys(payloadFields));
const payloadEditMode = ref<"fields" | "json">("fields");
const payloadJsonText = ref("{}");
const payloadJsonError = ref<string | null>(null);
const newFieldName = ref("");
const editingItem = ref<BoardItem | null>(null);
const payloadEditDialog = ref<HTMLDialogElement>();

function clearPayloadFields() {
    for (const key of Object.keys(payloadFields)) {
        delete payloadFields[key];
    }
}

function loadPayloadIntoEditor(payload: BoardItem["payload"]) {
    clearPayloadFields();
    for (const [key, field] of Object.entries(payload || {})) {
        if (isEnvelopeField(field)) {
            payloadFields[key] = {
                label: String(field.label || key),
                value: valueToEditString(field.value),
                format: field.format ? String(field.format) : "",
            };
        } else {
            payloadFields[key] = {
                label: key,
                value: valueToEditString(field),
                format: "",
            };
        }
    }
    payloadJsonText.value = JSON.stringify(buildEnvelopePayload(), null, 2);
    payloadJsonError.value = null;
}

function buildEnvelopePayload(): Record<string, BoardPayloadField> {
    const payload: Record<string, BoardPayloadField> = {};
    for (const [key, field] of Object.entries(payloadFields)) {
        const entry: BoardPayloadField = {
            value: coerceFieldValue(field.value, field.format),
            label: field.label?.trim() || key,
        };
        if (field.format?.trim()) {
            entry.format = field.format.trim();
        }
        payload[key] = entry;
    }
    return payload;
}

function openEditPayload(item: BoardItem) {
    editingItem.value = item;
    payloadEditMode.value = "fields";
    newFieldName.value = "";
    loadPayloadIntoEditor(item.payload);
    payloadEditDialog.value?.showModal();
}

function switchToJsonMode() {
    payloadJsonText.value = JSON.stringify(buildEnvelopePayload(), null, 2);
    payloadJsonError.value = null;
    payloadEditMode.value = "json";
}

function addPayloadField() {
    const key = newFieldName.value.trim();
    if (!key) {
        alert("请输入字段名");
        return;
    }
    if (payloadFields[key]) {
        alert("字段已存在");
        return;
    }
    payloadFields[key] = { label: key, value: "", format: "" };
    newFieldName.value = "";
}

function removePayloadField(key: string) {
    delete payloadFields[key];
}

function parseJsonPayload(): Record<string, BoardPayloadField> | null {
    try {
        const parsed = JSON.parse(payloadJsonText.value || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            payloadJsonError.value = "载荷必须是 JSON 对象";
            return null;
        }

        const payload: Record<string, BoardPayloadField> = {};
        for (const [key, field] of Object.entries(parsed as Record<string, unknown>)) {
            if (!isEnvelopeField(field)) {
                payloadJsonError.value = `字段 "${key}" 必须是 { value, label, format? } 信封格式`;
                return null;
            }
            if (typeof field.label !== "string" || !field.label.trim()) {
                payloadJsonError.value = `字段 "${key}" 的 label 必须是非空字符串`;
                return null;
            }
            const entry: BoardPayloadField = {
                value: field.value,
                label: field.label.trim(),
            };
            if (field.format != null && String(field.format).trim()) {
                entry.format = String(field.format).trim();
            }
            payload[key] = entry;
        }

        payloadJsonError.value = null;
        return payload;
    } catch {
        payloadJsonError.value = "JSON 解析失败";
        return null;
    }
}

async function savePayload() {
    if (!editingItem.value || !boardUser.value) return;

    let payload: Record<string, BoardPayloadField>;
    if (payloadEditMode.value === "json") {
        const parsed = parseJsonPayload();
        if (!parsed) return;
        payload = parsed;
    } else {
        for (const [key, field] of Object.entries(payloadFields)) {
            if (!field.label?.trim()) {
                alert(`字段 "${key}" 的 label 不能为空`);
                return;
            }
        }
        payload = buildEnvelopePayload();
    }

    boardSaving.value = true;
    try {
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
</script>
