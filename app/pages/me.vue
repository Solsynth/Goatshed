<template>
    <main class="page-shell py-8">
        <div class="mx-auto max-w-2xl">
            <div
                v-if="!session"
                class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
            >
                <User class="mx-auto h-12 w-12 text-base-content/50" />
                <h1 class="mt-4 text-xl font-bold">未登录</h1>
                <p class="mt-2 text-sm text-base-content/60">
                    登录以查看你的个人资料。
                </p>
                <NuxtLink to="/login" class="btn btn-primary mt-4"
                    >登录</NuxtLink
                >
            </div>

            <template v-else>
                <section
                    class="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100"
                >
                    <div class="h-32 w-full bg-base-200 sm:h-40">
                        <img
                            v-if="backgroundUrl"
                            :src="backgroundUrl"
                            :alt="displayName"
                            class="h-full w-full object-cover"
                        />
                    </div>
                    <div
                        class="mx-auto -mt-16 flex flex-col gap-3 px-4 pb-4 sm:-mt-16 sm:flex-row sm:items-end"
                    >
                        <div class="mb-12 shrink-0">
                            <div v-if="avatarUrl" class="avatar">
                                <div
                                    class="h-20 w-20 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-24 sm:w-24"
                                >
                                    <img :src="avatarUrl" :alt="displayName" />
                                </div>
                            </div>
                            <div v-else class="avatar avatar-placeholder">
                                <div
                                    class="h-20 w-24 rounded-full bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-24 sm:w-24"
                                >
                                    <span class="text-xl font-semibold">{{
                                        initials
                                    }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="min-w-0 flex-1 max-lg:-mt-10 lg:pt-20">
                            <div class="flex flex-wrap items-center gap-2">
                                <h1
                                    class="truncate text-xl font-black sm:text-2xl"
                                >
                                    {{ displayName }}
                                </h1>
                                <span
                                    v-if="profile?.profile?.verification"
                                    class="badge badge-primary gap-1"
                                >
                                    <ShieldCheck class="h-3 w-3" />
                                    {{
                                        profile.profile.verification.title ||
                                        "已认证"
                                    }}
                                </span>
                            </div>
                            <p class="truncate text-sm text-base-content/60">
                                @{{ profile?.name || session.user.name }}
                            </p>
                        </div>
                    </div>
                </section>

                <div
                    class="mt-4 rounded-box border border-base-300 bg-base-100 p-4"
                >
                        <p
                            v-if="profile?.profile?.bio"
                            class="whitespace-pre-line text-sm text-base-content/80"
                        >
                            {{ profile.profile.bio }}
                        </p>
                    <p v-else class="text-sm text-base-content/50 italic">
                        暂无简介。
                    </p>
                </div>

                <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5">
                    <div class="flex items-center gap-3 mb-4">
                        <Ticket class="h-5 w-5 text-primary" />
                        <h2 class="text-lg font-bold">陪玩票</h2>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="rounded-xl bg-base-200 p-3 text-center">
                            <div class="text-2xl font-bold text-primary">{{ ticketBalance.total }}</div>
                            <div class="text-xs text-base-content/50">总票数</div>
                        </div>
                        <div class="rounded-xl bg-base-200 p-3 text-center">
                            <div class="text-2xl font-bold text-warning">{{ ticketBalance.used }}</div>
                            <div class="text-xs text-base-content/50">已使用</div>
                        </div>
                        <div class="rounded-xl bg-base-200 p-3 text-center">
                            <div class="text-2xl font-bold text-success">{{ ticketBalance.available }}</div>
                            <div class="text-xs text-base-content/50">可用</div>
                        </div>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <NuxtLink to="/store/buy/gaming" class="btn btn-primary btn-sm flex-1">购买陪玩票</NuxtLink>
                        <NuxtLink to="/mahjong" class="btn btn-ghost btn-sm">麻将场次</NuxtLink>
                    </div>
                </div>

                <div class="mt-4 rounded-box border border-base-300 bg-base-100">
                    <div class="p-2">
                        <NuxtLink
                            to="/orders"
                            class="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-base-200"
                        >
                            <Receipt class="h-5 w-5 text-primary" />
                            <span class="flex-1 text-primary font-medium"
                                >我的订单</span
                            >
                            <ChevronRight
                                class="h-4 w-4 text-base-content/50"
                            />
                        </NuxtLink>
                        <NuxtLink
                            v-if="isAdmin"
                            to="/admin"
                            class="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-base-200"
                        >
                            <Shield class="h-5 w-5 text-primary" />
                            <span class="flex-1 text-primary font-medium"
                                >管理面板</span
                            >
                            <ChevronRight
                                class="h-4 w-4 text-base-content/50"
                            />
                        </NuxtLink>
                    </div>
                </div>

                <div class="mt-4 space-y-3">
                    <div class="rounded-box border border-base-300 bg-base-100">
                        <div class="p-2">
                            <button
                                class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-base-200"
                                :disabled="isRefreshing"
                                @click="refreshProfile"
                            >
                                <RefreshCw
                                    :class="[
                                        'h-5 w-5 text-base-content/70',
                                        { 'animate-spin': isRefreshing },
                                    ]"
                                />
                                <span class="flex-1">{{
                                    isRefreshing ? "刷新中..." : "刷新资料"
                                }}</span>
                                <span class="text-xs text-base-content/40">{{
                                    profileUpdatedAt
                                }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="rounded-box border border-base-300 bg-base-100">
                        <div class="p-2">
                            <div class="flex items-center gap-3 rounded-xl p-3">
                                <Mail class="h-5 w-5 text-base-content/70" />
                                <span
                                    class="flex-1 text-sm text-base-content/60"
                                    >邮箱</span
                                >
                                <span class="text-sm">{{
                                    profile?.profile?.email || "-"
                                }}</span>
                            </div>
                            <div class="flex items-center gap-3 rounded-xl p-3">
                                <Globe class="h-5 w-5 text-base-content/70" />
                                <span
                                    class="flex-1 text-sm text-base-content/60"
                                    >语言</span
                                >
                                <span class="text-sm">{{
                                    profile?.language || "-"
                                }}</span>
                            </div>
                            <div class="flex items-center gap-3 rounded-xl p-3">
                                <MapPin class="h-5 w-5 text-base-content/70" />
                                <span
                                    class="flex-1 text-sm text-base-content/60"
                                    >地区</span
                                >
                                <span class="text-sm">{{
                                    profile?.region || "-"
                                }}</span>
                            </div>
                            <div class="flex items-center gap-3 rounded-xl p-3">
                                <MapPinned
                                    class="h-5 w-5 text-base-content/70"
                                />
                                <span
                                    class="flex-1 text-sm text-base-content/60"
                                    >位置</span
                                >
                                <span class="text-sm">{{
                                    profile?.profile?.location || "-"
                                }}</span>
                            </div>
                            <div class="flex items-center gap-3 rounded-xl p-3">
                                <Clock class="h-5 w-5 text-base-content/70" />
                                <span
                                    class="flex-1 text-sm text-base-content/60"
                                    >时区</span
                                >
                                <span class="text-sm">{{
                                    profile?.profile?.timeZone || "-"
                                }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-box border border-base-300 bg-base-100">
                        <div class="p-2">
                            <button
                                class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-base-200"
                                @click="showLogoutConfirm = true"
                            >
                                <LogOut class="h-5 w-5 text-error" />
                                <span class="flex-1 text-error">退出登录</span>
                                <ChevronRight
                                    class="h-4 w-4 text-base-content/50"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <dialog :open="showLogoutConfirm" class="modal">
            <div class="modal-box max-w-sm">
                <h3 class="text-lg font-bold">退出登录</h3>
                <p class="py-4">确定要退出登录吗？</p>
                <div class="modal-action">
                    <form method="dialog">
                        <button
                            class="btn btn-ghost"
                            @click="showLogoutConfirm = false"
                        >
                            取消
                        </button>
                    </form>
                    <button
                        class="btn btn-error"
                        :disabled="isLoggingOut"
                        @click="logout"
                    >
                        <Loader2
                            v-if="isLoggingOut"
                            class="h-4 w-4 animate-spin"
                        />
                        <LogOut v-else class="h-4 w-4" />
                        退出登录
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="showLogoutConfirm = false">关闭</button>
            </form>
        </dialog>
    </main>
</template>

<script setup lang="ts">
import {
    User,
    Shield,
    ShieldCheck,
    ChevronRight,
    Mail,
    Globe,
    MapPin,
    MapPinned,
    Clock,
    LogOut,
    Loader2,
    RefreshCw,
    Receipt,
    Ticket,
} from "lucide-vue-next";
definePageMeta({
    middleware: ["auth"],
});

const config = useRuntimeConfig();
const router = useRouter();
const auth = useAuth();

const showLogoutConfirm = ref(false);
const isLoggingOut = ref(false);
const isRefreshing = ref(false);
const ticketBalance = ref({ total: 0, used: 0, available: 0 });

const { data: session } = await auth.useSession(useFetch);
const { data: profile } = await useFetch<Record<string, any> | null>(
    "/api/sn/profile",
    {
        default: () => null,
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    },
);
const { data: roleData } = await useFetch<{ isAdmin: boolean }>(
    "/api/auth/role",
    {
        default: () => ({ isAdmin: false }),
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    },
);
const isAdmin = computed(() => roleData.value?.isAdmin ?? false);

const displayName = computed(() => {
    if (!session.value) return "未知用户";
    return (
        profile.value?.profile?.nick || session.value.user?.name || "未知用户"
    );
});

const avatarUrl = computed(() => {
    const name = profile?.value?.name || session.value?.user?.name;
    if (!name) return "";
    return `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(name)}/picture`;
});

const backgroundUrl = computed(() => {
    const bg = profile.value?.profile?.background;
    if (!bg?.id) return "";
    return (
        bg.url ||
        `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`
    );
});

const initials = computed(() => {
    const source = displayName.value;
    return source.slice(0, 2).toUpperCase();
});

const profileUpdatedAt = computed(() => {
    const updatedAt = profile.value?.updatedAt;
    if (!updatedAt) return "从未";
    const d = new Date(updatedAt);
    return d.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
});

async function refreshProfile() {
    isRefreshing.value = true;
    try {
        const data = await $fetch<Record<string, any>>("/api/sn/refresh", {
            method: "POST",
        });
        if (data) {
            profile.value = { ...data, updatedAt: new Date().toISOString() };
        }
    } catch {
        // silently fail
    } finally {
        isRefreshing.value = false;
    }
}

async function logout() {
    isLoggingOut.value = true;
    try {
        await auth.signOut();
        showLogoutConfirm.value = false;
        await router.push("/");
    } finally {
        isLoggingOut.value = false;
    }
}

onMounted(async () => {
    try {
        ticketBalance.value = await $fetch("/api/sessions/tickets") as { total: number; used: number; available: number };
    } catch {
        // silently fail
    }
});

useHead({ title: "我的账户" });
</script>
