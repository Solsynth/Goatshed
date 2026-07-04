<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-5xl">
            <div class="mb-8 text-center">
                <h1 class="text-3xl font-black">小羊的商店</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    支持小羊，购买小羊的服务和产品
                </p>
            </div>

            <div v-if="products.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="product in products"
                    :key="product.id"
                    class="group rounded-2xl border border-base-300 bg-base-100 overflow-hidden transition-shadow hover:shadow-lg"
                >
                    <div class="aspect-square bg-base-200 overflow-hidden">
                        <img
                            v-if="product.pictureUrl"
                            :src="product.pictureUrl"
                            :alt="product.displayName"
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div v-else class="flex h-full items-center justify-center">
                            <Package class="h-16 w-16 text-base-content/20" />
                        </div>
                    </div>
                    <div class="p-5">
                        <h3 class="text-lg font-bold">{{ product.displayName }}</h3>
                        <p class="mt-1 line-clamp-2 text-sm text-base-content/60">
                            {{ product.description }}
                        </p>
                        <div class="mt-4 flex items-center justify-between">
                            <div>
                                <span class="text-2xl font-black text-primary">{{ product.price }}</span>
                                <span class="ml-1 text-sm text-base-content/50">{{ product.currency }}</span>
                            </div>
                            <NuxtLink
                                :to="`/store/buy/${product.identifier}`"
                                class="btn btn-primary btn-sm gap-1"
                            >
                                <ShoppingCart class="h-4 w-4" />
                                购买
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="isLoading" class="rounded-2xl border border-base-300 bg-base-100 p-12 text-center">
                <Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
                <p class="mt-2 text-base-content/50">加载中...</p>
            </div>

            <div v-else class="rounded-2xl border border-base-300 bg-base-100 p-12 text-center">
                <Package class="mx-auto h-12 w-12 text-base-content/20" />
                <p class="mt-2 text-base-content/50">暂无商品</p>
            </div>

            <p v-if="error" class="mt-4 text-center text-sm text-error">{{ error }}</p>
        </div>
    </main>
</template>

<script setup lang="ts">
import { Package, ShoppingCart, Loader2 } from "lucide-vue-next";

interface ShopProduct {
    id: string;
    identifier: string;
    displayName: string;
    description: string;
    currency: string;
    price: number;
    picture: {
        id: string;
        url: string;
        width: number;
        height: number;
        blurhash: string | null;
    } | null;
}

const products = ref<ShopProduct[]>([]);
const isLoading = ref(true);
const error = ref("");

onMounted(async () => {
    try {
        const data = await $fetch<ShopProduct[]>("/api/shop/products");
        products.value = data || [];
    } catch (e: any) {
        error.value = e.data?.message || "加载商品失败";
    } finally {
        isLoading.value = false;
    }
});

useHead({ title: "商店" });
</script>
