<template>
  <header
    class="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/85 backdrop-blur-lg max-lg:px-4"
  >
    <div class="page-shell navbar min-h-16 px-0 sm:min-h-18">
      <div class="navbar-start">
        <NuxtLink
          to="/"
          class="btn btn-ghost px-2 text-lg font-extrabold normal-case sm:text-xl"
        >
          <img :src="BrandingCompact" alt="Goatshed" class="h-8" />
        </NuxtLink>
      </div>

      <div class="navbar-center hidden md:flex">
        <ul class="flex items-center gap-1 px-1">
          <li>
            <NuxtLink
              to="/"
              class="nav-link inline-flex items-center gap-1.5"
              active-class="nav-link-active"
            >
              <House class="h-4 w-4" />
              博客
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/posts"
              class="nav-link inline-flex items-center gap-1.5"
              active-class="nav-link-active"
            >
              <FileText class="h-4 w-4" />
              文章
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/moments"
              class="nav-link inline-flex items-center gap-1.5"
              active-class="nav-link-active"
            >
              <MessageCircle class="h-4 w-4" />
              动态
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/about"
              class="nav-link inline-flex items-center gap-1.5"
              active-class="nav-link-active"
            >
              <Info class="h-4 w-4" />
              关于
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="navbar-end gap-2">
        <div class="dropdown dropdown-end md:hidden">
          <button
            tabindex="0"
            class="btn btn-ghost btn-sm px-2"
            aria-label="打开导航菜单"
          >
            <Menu class="h-5 w-5" />
          </button>
          <ul
            tabindex="0"
            class="menu dropdown-content mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
          >
            <li>
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <House class="h-4 w-4" />
                博客
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/posts"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <FileText class="h-4 w-4" />
                文章
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/moments"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <MessageCircle class="h-4 w-4" />
                动态
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="inline-flex items-center gap-2"
                active-class="bg-base-200 text-primary"
              >
                <Info class="h-4 w-4" />
                关于
              </NuxtLink>
            </li>
            <li class="menu-title mt-1 border-t border-base-300 pt-2">
              <span class="text-xs opacity-60">账户</span>
            </li>
            <template v-if="auth.authenticated.value && auth.user.value">
              <li>
                <NuxtLink to="/me" class="inline-flex items-center gap-2">
                  <User class="h-4 w-4" />
                  {{ auth.user.value.nick || auth.user.value.name }}
                </NuxtLink>
              </li>
              <li>
                <button
                  class="inline-flex items-center gap-2 text-error"
                  @click="auth.logout"
                >
                  <LogOut class="h-4 w-4" />
                  退出登录
                </button>
              </li>
            </template>
            <template v-else>
              <li>
                <NuxtLink to="/login" class="inline-flex items-center gap-2">
                  <LogIn class="h-4 w-4" />
                  登录
                </NuxtLink>
              </li>
            </template>
          </ul>
        </div>

        <template v-if="auth.authenticated.value && auth.user.value">
          <details class="dropdown dropdown-end hidden md:block">
            <summary
              class="list-none flex items-center gap-2 rounded-box sm:px-3 cursor-pointer"
            >
              <div class="avatar">
                <div class="h-7 w-7 rounded-full bg-base-300">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    :alt="auth.user.value.name"
                    loading="lazy"
                  />
                </div>
              </div>
            </summary>

            <ul
              class="menu dropdown-content mt-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-sm z-50"
            >
              <li>
                <NuxtLink to="/me">我的账户</NuxtLink>
              </li>
              <li>
                <button @click="auth.logout">退出登录</button>
              </li>
            </ul>
          </details>
        </template>

        <template v-else>
          <NuxtLink
            to="/login"
            class="btn btn-primary btn-sm hidden md:inline-flex"
            >登录</NuxtLink
          >
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import BrandingCompact from "~/assets/branding/compact.png";

import {
  FileText,
  House,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  User,
} from "lucide-vue-next";

const auth = useAuth();
const config = useRuntimeConfig();

const avatarUrl = computed(() => {
  const username = auth.user.value?.username || auth.user.value?.name;
  if (!username) return "";
  return `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(username)}/picture`;
});
</script>
