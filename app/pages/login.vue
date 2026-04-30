<template>
  <main
    class="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8"
  >
    <div
      class="w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl backdrop-blur-xl"
    >
      <div class="grid md:grid-cols-[1fr_1.15fr]">
        <section
          class="flex flex-col justify-between rounded-t-3xl bg-base-100/50 p-6 backdrop-blur-2xl md:rounded-l-3xl md:rounded-tr-none md:p-8"
        >
          <div>
            <img
              src="/favicon.png"
              alt="Goatshed"
              class="h-12 w-12 rounded-full"
            />
            <h1 class="mt-4 text-3xl font-black leading-tight">欢迎回来</h1>
            <p class="mt-3 max-w-sm text-sm text-base-content/70">
              使用你的 Solarpass 登录 Goatshed。本站维护独立会话。
            </p>
          </div>
          <div class="mt-6">
            <p class="text-sm text-base-content/60">
              这是
              <a
                href="https://littlesheep.me"
                class="link link-primary font-semibold"
                target="_blank"
                >littlesheep</a
              >
              的个人博客。
            </p>
          </div>
        </section>

        <section
          class="rounded-b-2xl bg-base-100/90 p-6 md:rounded-r-2xl md:rounded-bl-none md:p-8"
        >
          <div class="space-y-6">
            <div class="space-y-1">
              <h2 class="text-xl font-bold">登录</h2>
              <p class="text-sm text-base-content/60">
                点击下方按钮通过 {{ providerName }} 登录
              </p>
            </div>

            <button class="btn btn-primary w-full gap-2" @click="startLogin">
              <LogIn class="h-4 w-4" />
              使用 {{ providerName }} 继续
            </button>

            <div class="divider text-base-content/40 text-sm">一些说明</div>

            <div class="space-y-3 text-xs text-base-content/60">
              <p>
                虽然 Solarpass 和 Goatshed 都是 @littlesheep 小羊的项目， 但是
                Goatshed 不隶属于 Solar Network。其维护两套帐号系统。
              </p>
              <p>
                本站使用 Solar Network 的 OpenID Connect
                能力，你的密码永远不会经过任何第三方离开 Solar Network
                的服务器。你也可以参考本站实现你自己的 Sign in with Solarpass :D
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { LogIn } from "lucide-vue-next";

definePageMeta({
  layout: false,
});

const route = useRoute();
const auth = useAuth();
const config = useRuntimeConfig();

const providerName = computed(() => config.public.oauthProviderName || "OAuth");

function startLogin() {
  const next = typeof route.query.next === "string" ? route.query.next : "/me";
  auth.login(next);
}

useHead({ title: "登录" });
</script>
