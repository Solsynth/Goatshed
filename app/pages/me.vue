<template>
  <main class="page-shell py-8">
    <div class="mx-auto max-w-4xl">
      <div
        v-if="!auth.authenticated.value"
        class="rounded-box border border-base-300 bg-base-100 p-8 text-center"
      >
        <User class="mx-auto h-12 w-12 text-base-content/50" />
        <h1 class="mt-4 text-xl font-bold">未登录</h1>
        <p class="mt-2 text-sm text-base-content/60">
          登录以查看你的个人资料。
        </p>
        <NuxtLink to="/login" class="btn btn-primary mt-4">登录</NuxtLink>
      </div>

      <template v-else-if="auth.user.value">
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
                  <span class="text-xl font-semibold">{{ initials }}</span>
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1 max-lg:-mt-10 lg:pt-20">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="truncate text-xl font-black sm:text-2xl">
                  {{ displayName }}
                </h1>
                <span
                  v-if="account?.profile?.verification"
                  class="badge badge-primary gap-1"
                >
                  <ShieldCheck class="h-3 w-3" />
                  {{ account.profile.verification.title || "已认证" }}
                </span>
              </div>
              <p class="truncate text-sm text-base-content/60">
                @{{ auth.user.value.username || auth.user.value.name }}
              </p>
            </div>
          </div>
        </section>

        <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-4">
          <p v-if="account?.profile?.bio" class="text-sm text-base-content/80">
            {{ account.profile.bio }}
          </p>
          <p v-else class="text-sm text-base-content/50 italic">暂无简介。</p>
        </div>

        <div class="mt-4 space-y-3">
          <div class="rounded-box border border-base-300 bg-base-100">
            <div class="p-2">
              <NuxtLink
                :to="`https://solian.app/accounts/${account?.name}`"
                class="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-base-200"
              >
                <User class="h-5 w-5 text-base-content/70" />
                <span class="flex-1">查看公开主页</span>
                <ChevronRight class="h-4 w-4 text-base-content/50" />
              </NuxtLink>
            </div>
          </div>

          <div class="rounded-box border border-base-300 bg-base-100">
            <div class="p-2">
              <div class="flex items-center gap-3 rounded-xl p-3">
                <Mail class="h-5 w-5 text-base-content/70" />
                <span class="flex-1 text-sm text-base-content/60">邮箱</span>
                <span class="text-sm">{{
                  account?.profile?.email || "-"
                }}</span>
              </div>
              <div class="flex items-center gap-3 rounded-xl p-3">
                <Globe class="h-5 w-5 text-base-content/70" />
                <span class="flex-1 text-sm text-base-content/60">语言</span>
                <span class="text-sm">{{ account?.language || "-" }}</span>
              </div>
              <div class="flex items-center gap-3 rounded-xl p-3">
                <MapPin class="h-5 w-5 text-base-content/70" />
                <span class="flex-1 text-sm text-base-content/60">地区</span>
                <span class="text-sm">{{ account?.region || "-" }}</span>
              </div>
              <div class="flex items-center gap-3 rounded-xl p-3">
                <MapPinned class="h-5 w-5 text-base-content/70" />
                <span class="flex-1 text-sm text-base-content/60">位置</span>
                <span class="text-sm">{{
                  account?.profile?.location || "-"
                }}</span>
              </div>
              <div class="flex items-center gap-3 rounded-xl p-3">
                <Clock class="h-5 w-5 text-base-content/70" />
                <span class="flex-1 text-sm text-base-content/60">时区</span>
                <span class="text-sm">{{
                  account?.profile?.timeZone || "-"
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
                <ChevronRight class="h-4 w-4 text-base-content/50" />
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
            <button class="btn btn-ghost" @click="showLogoutConfirm = false">
              取消
            </button>
          </form>
          <button
            class="btn btn-error"
            :disabled="isLoggingOut"
            @click="logout"
          >
            <Loader2 v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
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
  ShieldCheck,
  ChevronRight,
  Mail,
  Globe,
  MapPin,
  MapPinned,
  Clock,
  LogOut,
  Loader2,
} from "lucide-vue-next";
import type { Account } from "~/types/account";

definePageMeta({
  middleware: ["auth"],
});

const auth = useAuth();
const config = useRuntimeConfig();
const router = useRouter();

const showLogoutConfirm = ref(false);
const isLoggingOut = ref(false);

const displayName = computed(
  () =>
    account.value?.profile?.nick ||
    auth.user.value?.nick ||
    auth.user.value?.name ||
    "未知用户",
);

const avatarUrl = computed(() => {
  const username = auth.user.value?.username || auth.user.value?.name;
  if (!username) return "";
  return `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(username)}/picture`;
});

const backgroundUrl = computed(() => {
  const bg = account.value?.profile?.background;
  if (!bg?.id) return "";
  return (
    bg.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(bg.id)}`
  );
});

const initials = computed(() => {
  const source = auth.user.value?.nick || auth.user.value?.name || "?";
  return source.slice(0, 2).toUpperCase();
});

const accountName = computed(
  () => auth.user.value?.username || auth.user.value?.name || "",
);

const { data: account } = await useFetch<Account | null>(
  () =>
    accountName.value
      ? `/api/accounts/${encodeURIComponent(accountName.value)}`
      : null,
  { default: () => null },
);

async function logout() {
  isLoggingOut.value = true;
  try {
    await auth.logout();
    showLogoutConfirm.value = false;
    await router.push("/");
  } finally {
    isLoggingOut.value = false;
  }
}

useHead({ title: "我的账户" });
</script>
