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
        </div>

        <dialog ref="confirmDialog" class="modal">
            <div class="modal-box max-w-sm">
                <h3 class="text-lg font-bold">完成支付了吗？</h3>
                <p class="py-4 text-sm text-base-content/70">
                    请在弹出的窗口中完成支付，完成后点击确认。
                </p>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost" :disabled="isChecking">
                            取消
                        </button>
                    </form>
                    <button
                        class="btn btn-primary"
                        :disabled="isChecking"
                        @click="confirmPayment"
                    >
                        <Loader2 v-if="isChecking" class="h-4 w-4 animate-spin" />
                        <Check v-else class="h-4 w-4" />
                        确认
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>关闭</button>
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
                        to="/sponsors"
                        class="btn btn-primary"
                    >
                        查看打赏排行榜
                    </NuxtLink>
                    <NuxtLink
                        v-else-if="paymentResult === '已支付'"
                        to="/"
                        class="btn btn-primary"
                    >
                        返回首页
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
import { Heart, Ticket, Plus, Minus, Loader2, Check, Clock, ShoppingCart } from "lucide-vue-next";
import type { Component } from "vue";

const route = useRoute();
const productType = (route.query.product as string) || "donation";

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
const isChecking = ref(false);
const error = ref("");
const orderId = ref<string | null>(null);
const confirmDialog = ref<HTMLDialogElement>();
const resultDialog = ref<HTMLDialogElement>();
const paymentResult = ref<"已支付" | "待支付">("待支付");

const totalAmount = computed(() => {
    if (!product.value) return 0;
    const price = Number(product.value.price) || 0;
    return price * quantity.value;
});

async function submitOrder() {
    isSubmitting.value = true;
    error.value = "";
    try {
        const result = await $fetch<{ orderId: string; payUrl: string }>(
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
        orderId.value = result.orderId;
        window.open(result.payUrl, "_blank", "width=480,height=720");
        confirmDialog.value?.showModal();
    } catch (e: any) {
        error.value = e.data?.message || "创建订单失败，请稍后重试";
    } finally {
        isSubmitting.value = false;
    }
}

async function confirmPayment() {
    if (!orderId.value) return;
    isChecking.value = true;
    try {
        const result = await $fetch<{ status: string }>(
            `/api/donations/order/${orderId.value}`,
        );
        paymentResult.value = result.status === "已支付" ? "已支付" as any : "待支付" as any;
    } catch {
        paymentResult.value = "unpaid";
    } finally {
        isChecking.value = false;
        confirmDialog.value?.close();
        resultDialog.value?.showModal();
    }
}

useHead({ title: productTitle });
</script>
