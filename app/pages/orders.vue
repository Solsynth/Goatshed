<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-4xl">
            <div class="mb-6 flex items-center justify-between">
                <h1 class="text-2xl font-bold">我的订单</h1>
                <div class="flex gap-2">
                    <button
                        v-for="f in statusFilters"
                        :key="f.value"
                        :class="['btn btn-sm', activeStatus === f.value ? 'btn-primary' : 'btn-outline']"
                        @click="activeStatus = f.value; refresh()"
                    >
                        {{ f.label }}
                    </button>
                </div>
            </div>

            <div class="mb-4 flex gap-2">
                <button
                    :class="['btn btn-sm', activeProductType === '' ? 'btn-secondary' : 'btn-outline']"
                    @click="activeProductType = ''"
                >
                    全部
                </button>
                <button
                    :class="['btn btn-sm', activeProductType === 'donation' ? 'btn-secondary' : 'btn-outline']"
                    @click="activeProductType = 'donation'"
                >
                    打赏
                </button>
                <button
                    :class="['btn btn-sm', activeProductType === 'gaming' ? 'btn-secondary' : 'btn-outline']"
                    @click="activeProductType = 'gaming'"
                >
                    陪玩票
                </button>
                <div class="ml-auto flex items-center gap-2">
                    <button
                        class="btn btn-ghost btn-xs"
                        :disabled="isRefreshing"
                        @click="refresh"
                    >
                        <RefreshCw :class="['h-3 w-3', { 'animate-spin': isRefreshing }]" />
                        刷新
                    </button>
                </div>
            </div>

            <div v-if="orders.length > 0" class="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
                <table class="table table-zebra">
                    <thead>
                        <tr>
                            <th>类型</th>
                            <th>金额</th>
                            <th>数量</th>
                            <th>状态</th>
                            <th>发货</th>
                            <th>创建时间</th>
                            <th class="text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in orders" :key="order.id">
                            <td>
                                <span class="badge badge-sm badge-outline">
                                    {{ order.productType === 'gaming' ? '陪玩票' : '打赏' }}
                                </span>
                            </td>
                            <td class="font-bold">{{ order.amount }} {{ order.currency }}</td>
                            <td>×{{ order.quantity }}</td>
                            <td>
                                <span :class="['badge', getOrderBadge(order.status)]">
                                    {{ getOrderLabel(order.status) }}
                                </span>
                            </td>
                            <td>
                                <span v-if="order.deliveryStatus" :class="['badge', getDeliveryBadge(order.deliveryStatus)]">
                                    {{ getDeliveryLabel(order.deliveryStatus) }}
                                </span>
                                <span v-else class="text-base-content/30 text-sm">-</span>
                            </td>
                            <td class="text-sm text-base-content/60">{{ formatDate(order.createdAt) }}</td>
                            <td>
                                <div class="flex justify-end gap-1">
                                    <button
                                        v-if="order.status === '待支付'"
                                        class="btn btn-primary btn-xs"
                                        @click="openPayDialog(order)"
                                    >
                                        继续支付
                                    </button>
                                    <button
                                        v-if="order.status === '待支付'"
                                        class="btn btn-ghost btn-xs"
                                        title="从远端同步状态"
                                        :disabled="syncingOrderId === order.id"
                                        @click="syncRemote(order)"
                                    >
                                        <RefreshCw :class="['h-3 w-3', { 'animate-spin': syncingOrderId === order.id }]" />
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

            <div v-else-if="isLoading" class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
                <p class="mt-2 text-base-content/50">加载中...</p>
            </div>

            <div v-else class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Receipt class="mx-auto h-12 w-12 text-base-content/20" />
                <p class="mt-2 text-base-content/50">暂无订单</p>
                <div class="mt-4 flex justify-center gap-2">
                    <NuxtLink to="/store/buy/donation" class="btn btn-primary btn-sm">前往打赏</NuxtLink>
                    <NuxtLink to="/store/buy/gaming" class="btn btn-outline btn-sm">购买陪玩票</NuxtLink>
                </div>
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
                        <span class="text-base-content/60">类型</span>
                        <span class="badge badge-sm badge-outline">{{ selectedOrder.productType === 'gaming' ? '陪玩票' : '打赏' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">金额</span>
                        <span class="font-bold">{{ selectedOrder.amount }} {{ selectedOrder.currency }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">数量</span>
                        <span>×{{ selectedOrder.quantity }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-base-content/60">状态</span>
                        <span :class="['badge', getOrderBadge(selectedOrder.status)]">
                            {{ getOrderLabel(selectedOrder.status) }}
                        </span>
                    </div>
                    <div v-if="selectedOrder.deliveryStatus" class="flex justify-between">
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
                    <button
                        v-if="selectedOrder?.status === '待支付'"
                        class="btn btn-primary"
                        @click="detailDialog?.close(); openPayDialog(selectedOrder)"
                    >
                        继续支付
                    </button>
                    <form method="dialog">
                        <button class="btn">关闭</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
            </form>
        </dialog>

        <dialog ref="payDialog" class="modal">
            <div class="modal-box max-w-sm">
                <h3 class="text-lg font-bold">完成支付了吗？</h3>
                <p class="py-4 text-sm text-base-content/70">
                    请在弹出的窗口中完成支付。页面每 30 秒自动从远端同步支付状态。
                </p>
                <div class="flex items-center gap-2 rounded-lg bg-base-200 p-3">
                    <div :class="['h-3 w-3 rounded-full', payStatus === '已支付' ? 'bg-success' : 'bg-warning animate-pulse']" />
                    <span class="text-sm font-medium">
                        {{ payStatus === '已支付' ? '已支付' : '等待支付' }}
                    </span>
                </div>
                <div class="modal-action">
                    <button
                        class="btn btn-ghost"
                        @click="retryPayment"
                    >
                        重新跳转钱包
                    </button>
                    <form method="dialog">
                        <button class="btn btn-ghost" @click="closePayDialog">
                            关闭
                        </button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closePayDialog">关闭</button>
            </form>
        </dialog>
    </main>
</template>

<script setup lang="ts">
import { Receipt, Eye, Loader2, RefreshCw } from "lucide-vue-next";

definePageMeta({
    middleware: ["auth"],
});

const LIMIT = 10;
const POLL_INTERVAL = 30000;

const orders = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const isLoading = ref(false);
const isRefreshing = ref(false);
const activeStatus = ref("");
const activeProductType = ref("");
const selectedOrder = ref<any>(null);
const detailDialog = ref<HTMLDialogElement>();
const payDialog = ref<HTMLDialogElement>();
const payStatus = ref<"待支付" | "checking" | "已支付">("待支付");
const payCheckCount = ref(0);
const pollingOrder = ref<any>(null);
const syncingOrderId = ref<string | null>(null);


const statusFilters = [
    { value: "", label: "全部" },
    { value: "待支付", label: "待支付" },
    { value: "已支付", label: "已支付" },
    { value: "已完成", label: "已完成" },
    { value: "已取消", label: "已取消" },
];

const totalPages = computed(() => Math.ceil(total.value / LIMIT));

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchOrders() {
    isLoading.value = true;
    try {
        const params = new URLSearchParams({ page: String(page.value), limit: String(LIMIT) });
        if (activeStatus.value) params.set("status", activeStatus.value);
        if (activeProductType.value) params.set("productType", activeProductType.value);
        const data = await $fetch(`/api/donations?${params.toString()}`);
        orders.value = data.orders;
        total.value = data.total;
    } catch {
        // silently fail
    } finally {
        isLoading.value = false;
    }
}

async function refresh() {
    isRefreshing.value = true;
    await fetchOrders();
    isRefreshing.value = false;
}

function viewOrder(order: any) {
    selectedOrder.value = order;
    detailDialog.value?.showModal();
}

function openPayDialog(order: any) {
    pollingOrder.value = order;
    payStatus.value = "待支付" as any;
    payCheckCount.value = 0;
    window.open(`https://solian.app/orders/${order.orderId}`, "_blank", "width=480,height=720");
    payDialog.value?.showModal();
    startPolling();
}

function closePayDialog() {
    pollingOrder.value = null;
    payDialog.value?.close();
}

function retryPayment() {
    if (pollingOrder.value) {
        window.open(`https://solian.app/orders/${pollingOrder.value.orderId}`, "_blank", "width=480,height=720");
    }
}

async function syncRemote(order: any) {
    syncingOrderId.value = order.id;
    try {
        const result = await $fetch<{ status: string }>(`/api/donations/order/${order.id}`);
        const localOrder = orders.value.find(o => o.id === order.id);
        if (localOrder) localOrder.status = result.status;
        if (pollingOrder.value?.id === order.id) {
            pollingOrder.value.status = result.status;
        }
    } catch {
        // silently fail
    } finally {
        syncingOrderId.value = null;
    }
}

async function syncSingleOrder(order: any) {
    payStatus.value = "checking";
    try {
        const result = await $fetch<{ status: string }>(`/api/donations/order/${order.id}`);
        payCheckCount.value++;

        order.status = result.status;
        const listOrder = orders.value.find(o => o.id === order.id);
        if (listOrder) listOrder.status = result.status;

        if (result.status === "已支付") {
            payStatus.value = "已支付" as any;
        } else {
            payStatus.value = "待支付" as any;
        }
    } catch {
        payStatus.value = "待支付" as any;
    }
}



function startPolling() {
    stopPolling();
    syncSingleOrder(pollingOrder.value);
    pollTimer = setInterval(() => syncSingleOrder(pollingOrder.value), POLL_INTERVAL);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

function getOrderBadge(status: string) {
    const map: Record<string, string> = { "已支付": "badge-success", "待支付": "badge-warning", "已完成": "badge-info", "已取消": "badge-error" };
    return map[status] || "badge-ghost";
}

function getOrderLabel(status: string) {
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

onMounted(() => {
    fetchOrders();
});

onUnmounted(() => {
    stopPolling();
});

watch([activeStatus, activeProductType], () => {
    page.value = 1;
    refresh();
});

useHead({ title: "我的订单" });
</script>
