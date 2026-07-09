<template>
    <div>
        <h1 class="mb-4 text-xl font-bold md:mb-6 md:text-2xl">概览</h1>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border border-base-300 bg-base-100 p-5">
                <div class="text-sm text-base-content/60">总订单</div>
                <div class="mt-1 text-2xl font-bold">{{ stats?.orders.total ?? "-" }}</div>
            </div>
            <div class="rounded-xl border border-base-300 bg-base-100 p-5">
                <div class="text-sm text-base-content/60">已支付</div>
                <div class="mt-1 text-2xl font-bold text-success">{{ stats?.orders.paid ?? "-" }}</div>
            </div>
            <div class="rounded-xl border border-base-300 bg-base-100 p-5">
                <div class="text-sm text-base-content/60">待支付</div>
                <div class="mt-1 text-2xl font-bold text-warning">{{ stats?.orders.unpaid ?? "-" }}</div>
            </div>
            <div class="rounded-xl border border-base-300 bg-base-100 p-5">
                <div class="text-sm text-base-content/60">总金额</div>
                <div class="mt-1 text-2xl font-bold text-primary">{{ stats?.orders.totalAmount ?? "0" }}</div>
            </div>
        </div>

        <div class="mt-8">
            <h2 class="mb-4 text-lg font-bold">最近订单</h2>
            <div v-if="stats?.recent?.length" class="overflow-x-auto rounded-xl border border-base-300">
                <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>类型</th>
                        <th>用户</th>
                        <th>金额</th>
                        <th>状态</th>
                        <th>时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in stats.recent" :key="order.id">
                        <td>
                            <span class="badge badge-sm badge-outline">
                                {{ order.productType === 'gaming' ? '陪玩票' : '打赏' }}
                            </span>
                        </td>
                        <td class="font-medium">{{ order.userName }}</td>
                        <td>{{ order.amount }} {{ order.currency }}</td>
                            <td>
                                <span :class="['badge', getStatusBadge(order.status)]">
                                    {{ getStatusLabel(order.status) }}
                                </span>
                            </td>
                            <td class="text-sm text-base-content/60">
                                {{ formatDate(order.createdAt) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="rounded-xl border border-base-300 bg-base-100 p-12 text-center">
                <Receipt class="mx-auto h-12 w-12 text-base-content/30" />
                <p class="mt-2 text-base-content/50">暂无订单</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Receipt } from "lucide-vue-next";

definePageMeta({
    layout: "admin",
    middleware: ["auth"],
});

const { data: stats } = await useFetch("/api/admin/stats", {
    headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
});

function getStatusBadge(status: string) {
    const map: Record<string, string> = { "已支付": "badge-success", "待支付": "badge-warning", "已完成": "badge-info", "已取消": "badge-error" };
    return map[status] || "badge-ghost";
}

function getStatusLabel(status: string) {
    return status;
}

function formatDate(date: string | Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

useHead({ title: "Admin - 概览" });
</script>
