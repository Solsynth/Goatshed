<template>
    <div>
        <h1 class="mb-6 text-2xl font-bold">用户管理</h1>

        <div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>用户</th>
                        <th>邮箱</th>
                        <th>管理员</th>
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
                        <td class="text-sm text-base-content/60">{{ formatDate(u.createdAt) }}</td>
                        <td>
                            <div class="flex gap-1">
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
    </div>
</template>

<script setup lang="ts">
import { Users, Pencil, Trash2, Loader2 } from "lucide-vue-next";

definePageMeta({
    layout: "admin",
    middleware: ["auth"],
});

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
