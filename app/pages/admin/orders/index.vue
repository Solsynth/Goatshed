<template>
    <div>
        <div class="mb-4 flex items-center justify-between md:mb-6">
            <h1 class="text-xl font-bold md:text-2xl">订单管理</h1>
            <div class="flex gap-2">
                <button
                    v-for="s in statusFilters"
                    :key="s.value"
                    :class="['btn btn-sm', activeStatus === s.value ? 'btn-primary' : 'btn-outline']"
                    @click="activeStatus = s.value; refresh(true)"
                >
                    {{ s.label }}
                </button>
            </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>订单号</th>
                        <th>类型</th>
                        <th>用户</th>
                        <th>金额</th>
                        <th>数量</th>
                        <th>留言</th>
                        <th>状态</th>
                        <th>发货</th>
                        <th>支付时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orders" :key="order.id">
                        <td class="font-mono text-xs">{{ order.orderId.slice(0, 8) }}</td>
                        <td>
                            <span class="badge badge-sm badge-outline">
                                {{ order.productType === 'gaming' ? '陪玩票' : '打赏' }}
                            </span>
                        </td>
                        <td>
                            <div class="font-medium">{{ order.userName }}</div>
                            <div class="text-xs text-base-content/40">{{ order.userEmail }}</div>
                        </td>
                        <td class="font-bold">{{ order.amount }} {{ order.currency }}</td>
                        <td>×{{ order.quantity }}</td>
                        <td class="max-w-32 truncate text-sm text-base-content/60">{{ order.remarks || "-" }}</td>
                        <td>
                            <span :class="['badge', getStatusBadge(order.status)]">
                                {{ getStatusLabel(order.status) }}
                            </span>
                        </td>
                        <td>
                            <select
                                v-if="order.status === '已支付'"
                                :class="['select select-bordered select-xs w-24', getDeliveryBadge(order.deliveryStatus)]"
                                :value="order.deliveryStatus || 'pending'"
                                @change="updateDelivery(order, ($event.target as HTMLSelectElement).value)"
                            >
                                <option value="pending">待发货</option>
                                <option value="shipped">已发货</option>
                                <option value="completed">已完成</option>
                            </select>
                            <span v-else :class="['badge', getDeliveryBadge(order.deliveryStatus)]">
                                {{ getDeliveryLabel(order.deliveryStatus) }}
                            </span>
                        </td>
                        <td class="text-sm text-base-content/60">{{ formatDate(order.paidAt) }}</td>
                        <td>
                            <div class="flex gap-1">
                                <button
                                    v-if="order.status === '已支付'"
                                    class="btn btn-ghost btn-xs"
                                    title="标记完成"
                                    @click="markFinished(order)"
                                >
                                    <CheckCheck class="h-3 w-3" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-xs"
                                    title="同步远程状态"
                                    :disabled="syncingId === order.id"
                                    @click="syncStatus(order)"
                                >
                                    <RefreshCw :class="['h-3 w-3', { 'animate-spin': syncingId === order.id }]" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-xs"
                                    title="详情"
                                    @click="viewOrder(order)"
                                >
                                    <Eye class="h-3 w-3" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="orders.length === 0" class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
            <Receipt class="mx-auto h-12 w-12 text-base-content/30" />
            <p class="mt-2 text-base-content/50">暂无订单</p>
        </div>

        <div v-if="totalPages > 1" class="mt-4 flex justify-center">
            <div class="join">
                <button
                    class="btn join-item btn-sm"
                    :disabled="page <= 1"
                    @click="page--; refresh()"
                >
                    上一页
                </button>
                <span class="btn join-item btn-sm btn-ghost">{{ page }} / {{ totalPages }}</span>
                <button
                    class="btn join-item btn-sm"
                    :disabled="page >= totalPages"
                    @click="page++; refresh()"
                >
                    下一页
                </button>
            </div>
        </div>

        <dialog ref="detailDialog" class="modal">
            <div class="modal-box max-w-lg">
                <h3 class="text-lg font-bold">订单详情</h3>
                <div v-if="selectedOrder" class="mt-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-base-content/60">订单号</span>
                        <span class="font-mono text-sm">{{ selectedOrder.orderId }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">用户</span>
                        <span>{{ selectedOrder.userName }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">邮箱</span>
                        <span>{{ selectedOrder.userEmail }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">类型</span>
                        <span class="badge badge-sm badge-outline">{{ selectedOrder.productType === 'gaming' ? '陪玩票' : '打赏' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">金额</span>
                        <span class="font-bold">{{ selectedOrder.amount }} {{ selectedOrder.currency }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">状态</span>
                        <span :class="['badge', getStatusBadge(selectedOrder.status)]">
                            {{ getStatusLabel(selectedOrder.status) }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">发货状态</span>
                        <span :class="['badge', getDeliveryBadge(selectedOrder.deliveryStatus)]">
                            {{ getDeliveryLabel(selectedOrder.deliveryStatus) }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">创建时间</span>
                        <span>{{ formatDate(selectedOrder.createdAt) }}</span>
                    </div>
                    <div v-if="selectedOrder.paidAt" class="flex justify-between">
                        <span class="text-base-content/60">支付时间</span>
                        <span>{{ formatDate(selectedOrder.paidAt) }}</span>
                    </div>
                    <div v-if="selectedOrder.remarks" class="rounded-lg bg-base-200 p-3">
                        <span class="text-sm text-base-content/60">留言：</span>
                        <p class="mt-1 text-sm">{{ selectedOrder.remarks }}</p>
                    </div>
                </div>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn">关闭</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { Receipt, CheckCheck, Eye, RefreshCw } from "lucide-vue-next";

definePageMeta({
    layout: "admin",
    middleware: ["auth"],
});

const LIMIT = 20;
const orders = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const activeStatus = ref("");
const selectedOrder = ref<any>(null);
const detailDialog = ref<HTMLDialogElement>();
const syncingId = ref<string | null>(null);

const statusFilters = [
    { value: "", label: "全部" },
    { value: "已支付", label: "已支付" },
    { value: "待支付", label: "待支付" },
    { value: "已完成", label: "已完成" },
];

const totalPages = computed(() => Math.ceil(total.value / LIMIT));

async function fetchOrders() {
    const params = new URLSearchParams({ page: String(page.value), limit: String(LIMIT) });
    if (activeStatus.value) params.set("status", activeStatus.value);
    const data = await $fetch(`/api/admin/orders?${params.toString()}`);
    orders.value = data.orders;
    total.value = data.total;
}

async function refresh(resetPage = false) {
    if (resetPage) page.value = 1;
    await fetchOrders();
}

onMounted(fetchOrders);

function viewOrder(order: any) {
    selectedOrder.value = order;
    detailDialog.value?.showModal();
}

async function markFinished(order: any) {
    await $fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status: "已完成" } });
    await fetchOrders();
}

async function updateDelivery(order: any, deliveryStatus: string) {
    await $fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { deliveryStatus } });
    order.deliveryStatus = deliveryStatus;
}

async function syncStatus(order: any) {
    syncingId.value = order.id;
    try {
        const result = await $fetch(`/api/admin/orders/${order.id}/sync`, { method: "POST" });
        order.status = result.status;
        order.deliveryStatus = result.deliveryStatus;
        order.paidAt = result.paidAt;
    } catch {
        // silently fail
    } finally {
        syncingId.value = null;
    }
}

function getStatusBadge(status: string) {
    const map: Record<string, string> = { "已支付": "badge-success", "待支付": "badge-warning", "已完成": "badge-info", "已取消": "badge-error" };
    return map[status] || "badge-ghost";
}

function getStatusLabel(status: string) {
    return status;
}

function getDeliveryBadge(status: string) {
    const map: Record<string, string> = { "pending": "badge-warning", "shipped": "badge-info", "completed": "badge-success" };
    return map[status] || "badge-ghost";
}

function getDeliveryLabel(status: string) {
    const map: Record<string, string> = { "pending": "待发货", "shipped": "已发货", "completed": "已完成" };
    return map[status] || status || "待发货";
}

function formatDate(date: string | Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

useHead({ title: "Admin - 订单管理" });
</script>
