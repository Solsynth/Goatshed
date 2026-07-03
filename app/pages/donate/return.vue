<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-xl">
            <div
                v-if="status === 'loading'"
                class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
            >
                <Loader2 class="mx-auto h-12 w-12 animate-spin text-primary" />
                <h1 class="mt-4 text-xl font-bold">确认支付状态...</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    正在等待支付确认，请稍候。
                </p>
            </div>

            <div
                v-else-if="status === 'paid'"
                class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
            >
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                    <Check class="h-8 w-8 text-success" />
                </div>
                <h1 class="mt-4 text-xl font-bold">支付成功！</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    订单已支付成功，感谢你的支持 ❤️
                </p>
                <p v-if="amount" class="mt-2 text-lg font-bold text-primary">
                    {{ amount }} {{ currency }}
                </p>
                <NuxtLink to="/sponsors" class="btn btn-primary mt-6">
                    查看赞助者名单
                </NuxtLink>
            </div>

            <div
                v-else-if="status === 'pending'"
                class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
            >
                <Clock class="mx-auto h-12 w-12 text-warning" />
                <h1 class="mt-4 text-xl font-bold">等待支付</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    订单已创建但尚未支付。请在 SolarPass 钱包中完成支付。
                </p>
                <button
                    class="btn btn-primary mt-4"
                    @click="retryPayment"
                >
                    重新跳转钱包
                </button>
            </div>

            <div
                v-else
                class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
            >
                <XCircle class="mx-auto h-12 w-12 text-error" />
                <h1 class="mt-4 text-xl font-bold">支付未完成</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    {{ errorMessage || "订单已取消或已过期，请重新尝试。" }}
                </p>
                <NuxtLink to="/store/buy?product=donation" class="btn btn-primary mt-4">
                    返回打赏
                </NuxtLink>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { Check, Loader2, Clock, XCircle } from "lucide-vue-next";

const route = useRoute();
const orderId = route.query.orderId as string;

const status = ref<"loading" | "paid" | "pending" | "failed">("loading");
const amount = ref("");
const currency = ref("");
const errorMessage = ref("");
const payUrl = ref("");
let pollCount = 0;
const MAX_POLLS = 20;

async function checkPayment() {
    if (!orderId) {
        status.value = "failed";
        errorMessage.value = "缺少订单信息";
        return;
    }

    try {
        const result = await $fetch<{
            status: string;
            amount: string;
            currency: string;
            payUrl?: string;
        }>(`/api/donations/order/${orderId}`);

        if (result.payUrl) payUrl.value = result.payUrl;

        if (result.status === "已支付") {
            status.value = "paid";
            amount.value = result.amount;
            currency.value = result.currency;
        } else if (result.status === "待支付") {
            pollCount++;
            if (pollCount >= MAX_POLLS) {
                status.value = "pending";
            } else {
                setTimeout(checkPayment, 3000);
            }
        } else {
            status.value = "failed";
            errorMessage.value =
                result.status === "已取消"
                    ? "订单已取消"
                    : result.status === "已过期"
                      ? "订单已过期"
                      : "支付失败";
        }
    } catch {
        status.value = "failed";
        errorMessage.value = "查询订单状态失败";
    }
}

function retryPayment() {
    if (payUrl.value) {
        window.location.href = payUrl.value;
    } else {
        navigateTo("/store/buy?product=donation");
    }
}

onMounted(() => {
    checkPayment();
});

useHead({ title: "打赏确认" });
</script>
