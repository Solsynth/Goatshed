<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-5xl">
            <div class="grid gap-8 lg:grid-cols-5">
                <div class="lg:col-span-3">
                    <div
                        v-if="product?.pictureUrl"
                        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 aspect-square"
                    >
                        <img
                            :src="product.pictureUrl"
                            :alt="product.displayName || productTitle"
                            class="h-full w-full object-cover"
                        />
                    </div>
                    <div
                        v-else
                        class="flex aspect-square items-center justify-center rounded-2xl border border-base-300 bg-base-100"
                    >
                        <component :is="productIcon" class="h-20 w-20 text-base-content/20" />
                    </div>

                    <div class="mt-6">
                        <h1 class="text-2xl font-black">{{ product?.displayName || productTitle }}</h1>
                        <p class="mt-3 leading-relaxed text-base-content/60">
                            {{ product?.description || productDescription }}
                        </p>
                    </div>
                </div>

                <div class="lg:col-span-2">
                    <div class="sticky top-24 rounded-2xl border border-base-300 bg-base-100 p-6">
                        <div class="mb-6">
                            <span class="text-3xl font-black text-primary">{{ product?.price || 0 }}</span>
                            <span class="ml-1 text-lg text-base-content/50">{{ product?.currency || "" }}</span>
                        </div>

                        <div class="space-y-5">
                            <div>
                                <label class="label px-0">
                                    <span class="label-text font-semibold">数量</span>
                                    <span class="label-text-alt text-base-content/40">
                                        每份 {{ product?.price || "?" }} {{ product?.currency || "" }}
                                    </span>
                                </label>
                                <div class="flex items-center gap-4">
                                    <div class="join">
                                        <button
                                            class="btn join-item btn-square"
                                            :disabled="quantity <= 1"
                                            @click="quantity = Math.max(1, quantity - 1)"
                                        >
                                            <Minus class="h-4 w-4" />
                                        </button>
                                        <input
                                            v-model.number="quantity"
                                            type="number"
                                            min="1"
                                            max="100"
                                            class="input join-item w-16 text-center" />
                                        <button
                                            class="btn join-item btn-square"
                                            :disabled="quantity >= 100"
                                            @click="quantity = Math.min(100, quantity + 1)"
                                        >
                                            <Plus class="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div class="ml-auto text-right">
                                        <div class="text-xs text-base-content/40">合计</div>
                                        <div class="text-lg font-bold text-primary">
                                            {{ totalAmount }} {{ product?.currency || "" }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="label px-0">
                                    <span class="label-text font-semibold">留言（可选）</span>
                                </label>
                                <textarea
                                    v-model="message"
                                    maxlength="200"
                                    :placeholder="messagePlaceholder"
                                    class="textarea textarea-bordered w-full resize-none"
                                    rows="2"
                                />
                                <div class="mt-1 text-right text-xs text-base-content/40">
                                    {{ message.length }}/200
                                </div>
                            </div>

                            <button
                                class="btn btn-primary btn-block btn-lg gap-2"
                                :disabled="isSubmitting"
                                @click="submitOrder"
                            >
                                <Loader2 v-if="isSubmitting" class="h-5 w-5 animate-spin" />
                                <ShoppingCart v-else class="h-5 w-5" />
                                {{ isSubmitting ? "创建订单中..." : actionLabel }}
                            </button>

                            <p class="text-center text-xs text-base-content/40">
                                通过 Solarpass 钱包安全支付
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <p v-if="error" class="mt-4 text-center text-sm text-error">
                {{ error }}
            </p>

            <div v-if="productType === 'gaming'" class="mt-10">
                <div class="mb-4 flex items-center gap-2">
                    <Gamepad2 class="h-5 w-5 text-primary" />
                    <h2 class="text-lg font-bold">可加入的陪玩场次</h2>
                </div>
                <div v-if="gamingSessions.length > 0" class="space-y-3">
                    <div
                        v-for="s in gamingSessions"
                        :key="s.id"
                        class="flex items-center justify-between rounded-xl border border-base-300 bg-base-100 p-4"
                    >
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="font-semibold">{{ s.name }}</div>
                                <span :class="['badge badge-xs', getSessionStatusBadge(s.status)]">
                                    {{ getSessionStatusLabel(s.status) }}
                                </span>
                            </div>
                            <div v-if="s.description" class="mt-0.5 text-sm text-base-content/50">{{ s.description }}</div>
                            <div class="mt-1 text-xs text-base-content/40">{{ s.participantCount }} 人已加入</div>
                        </div>
                        <span class="badge badge-info shrink-0">{{ s.ticketCost }} 张票</span>
                    </div>
                </div>
                <div v-else class="rounded-xl border border-base-300 bg-base-100 p-8 text-center text-sm text-base-content/50">
                    暂无陪玩场次，购买票后等待场次开放
                </div>
            </div>
        </div>

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
                        title="手动从远端同步状态"
                        @click="confirmPayment"
                    >
                        <RefreshCw class="h-4 w-4" />
                    </button>
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

        <dialog ref="resultDialog" class="modal">
            <div class="modal-box max-w-sm text-center">
                <div
                    v-if="paymentResult === '已支付'"
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
                >
                    <Check class="h-8 w-8 text-success" />
                </div>
                <div
                    v-else
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/20"
                >
                    <Clock class="h-8 w-8 text-warning" />
                </div>
                <h3 class="mt-4 text-lg font-bold">
                    {{ paymentResult === "已支付" ? successTitle : "等待支付" }}
                </h3>
                <p class="mt-2 text-sm text-base-content/60">
                    {{ paymentResult === "已支付" ? successMessage : "订单尚未支付，请在钱包中完成后再确认。" }}
                </p>
                <div class="modal-action justify-center">
                    <NuxtLink
                        v-if="paymentResult === '已支付' && productType === 'donation'"
                        to="/donate"
                        class="btn btn-primary"
                    >
                        查看打赏排行榜
                    </NuxtLink>
                    <NuxtLink
                        v-else-if="paymentResult === '已支付' && productType === 'gaming'"
                        to="/sessions"
                        class="btn btn-primary"
                    >
                        查看陪玩场次
                    </NuxtLink>
                    <form v-else method="dialog">
                        <button class="btn btn-ghost">关闭</button>
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
import { Heart, Ticket, Plus, Minus, Loader2, Check, Clock, ShoppingCart, RefreshCw, Gamepad2 } from "lucide-vue-next";
import type { Component } from "vue";

const route = useRoute();
const productType = (route.params.product as string) || "donation";

const productConfig: Record<string, {
    title: string;
    description: string;
    placeholder: string;
    actionLabel: string;
    successTitle: string;
    successMessage: string;
    icon: Component;
}> = {
    donation: {
        title: "小羊的爱",
        description: "每一份支持都是我继续创作的动力 ❤️",
        placeholder: "给小羊说点什么吧...",
        actionLabel: "立即支持",
        successTitle: "感谢支持！",
        successMessage: "你的打赏已到账 ❤️",
        icon: Heart,
    },
    gaming: {
        title: "陪玩票",
        description: "和小羊一起玩游戏吧",
        placeholder: "留下你的游戏 ID 或备注...",
        actionLabel: "购买陪玩票",
        successTitle: "购买成功！",
        successMessage: "你的陪玩券已到账，等我联系你",
        icon: Ticket,
    },
};

const config = productConfig[productType] || productConfig.donation;
const productTitle = config.title;
const productDescription = config.description;
const messagePlaceholder = config.placeholder;
const actionLabel = config.actionLabel;
const successTitle = config.successTitle;
const successMessage = config.successMessage;
const productIcon = config.icon;

definePageMeta({
    middleware: ["auth"],
});

const { data: product } = await useFetch<Record<string, any> | null>(
    "/api/donations/product",
    {
        query: { type: productType },
        default: () => null,
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    },
);

const quantity = ref(1);
const message = ref("");
const isSubmitting = ref(false);
const error = ref("");
const orderDbId = ref<string | null>(null);
const orderExternalId = ref<string | null>(null);
const payDialog = ref<HTMLDialogElement>();
const resultDialog = ref<HTMLDialogElement>();
const paymentResult = ref<"已支付" | "待支付">("待支付");
const payStatus = ref<"待支付" | "待支付">("待支付");

const gamingSessions = ref<any[]>([]);

const POLL_INTERVAL = 30000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

const totalAmount = computed(() => {
    if (!product.value) return 0;
    const price = Number(product.value.price) || 0;
    return price * quantity.value;
});

async function submitOrder() {
    isSubmitting.value = true;
    error.value = "";
    try {
        const result = await $fetch<{ id: string; orderId: string; payUrl: string }>(
            "/api/donations/order",
            {
                method: "POST",
                body: {
                    product: productType,
                    quantity: quantity.value,
                    message: message.value || undefined,
                },
            },
        );
        orderDbId.value = result.id;
        orderExternalId.value = result.orderId;
        payStatus.value = "待支付";
        window.open(result.payUrl, "_blank", "width=480,height=720");
        payDialog.value?.showModal();
        startPolling();
    } catch (e: any) {
        error.value = e.data?.message || "创建订单失败，请稍后重试";
    } finally {
        isSubmitting.value = false;
    }
}

function closePayDialog() {
    orderDbId.value = null;
    orderExternalId.value = null;
    payDialog.value?.close();
}

function retryPayment() {
    if (orderExternalId.value) {
        window.open(`https://solian.app/orders/${orderExternalId.value}`, "_blank", "width=480,height=720");
    }
}

async function syncSingleOrder() {
    if (!orderDbId.value) return;
    try {
        const result = await $fetch<{ status: string }>(
            `/api/donations/order/${orderDbId.value}`,
        );

        if (result.status === "已支付") {
            payStatus.value = "已支付";
            stopPolling();
            paymentResult.value = "已支付";
            payDialog.value?.close();
            resultDialog.value?.showModal();
        }
    } catch {
        // silently fail
    }
}

function startPolling() {
    stopPolling();
    syncSingleOrder();
    pollTimer = setInterval(() => syncSingleOrder(), POLL_INTERVAL);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

async function confirmPayment() {
    if (!orderDbId.value) return;
    try {
        const result = await $fetch<{ status: string }>(
            `/api/donations/order/${orderDbId.value}`,
        );
        if (result.status === "已支付") {
            payStatus.value = "已支付";
            stopPolling();
            paymentResult.value = "已支付";
            payDialog.value?.close();
            resultDialog.value?.showModal();
        }
    } catch {
        // silently fail
    }
}

useHead({ title: productTitle });

onUnmounted(() => {
    stopPolling();
});

if (productType === "gaming") {
    $fetch("/api/sessions").then((data: any) => {
        gamingSessions.value = data || [];
    }).catch(() => {});
}

function getSessionStatusBadge(status: string) {
    const map: Record<string, string> = { "upcoming": "badge-info", "ongoing": "badge-success", "ended": "badge-ghost" };
    return map[status] || "badge-ghost";
}

function getSessionStatusLabel(status: string) {
    const map: Record<string, string> = { "upcoming": "即将开始", "ongoing": "进行中", "ended": "已结束" };
    return map[status] || status;
}
</script>
