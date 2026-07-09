<template>
    <div class="min-h-screen bg-base-200">
        <!-- Mobile Top Navbar -->
        <header class="sticky top-0 z-30 flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3 md:hidden">
            <div class="flex items-center gap-2">
                <Shield class="h-5 w-5 text-primary" />
                <span class="font-bold">Admin</span>
            </div>
            <button
                class="btn btn-ghost btn-sm"
                aria-label="打开菜单"
                @click="mobileMenuOpen = true"
            >
                <Menu class="h-5 w-5" />
            </button>
        </header>

        <!-- Mobile Drawel Overlay -->
        <div
            v-if="mobileMenuOpen"
            class="fixed inset-0 z-40 bg-black/40 md:hidden"
            @click="mobileMenuOpen = false"
        ></div>

        <!-- Mobile Drawer -->
        <aside
            class="fixed inset-y-0 left-0 z-50 w-64 transform bg-base-100 p-4 transition-transform duration-200 md:hidden"
            :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <div class="flex items-center justify-between pb-4">
                <div class="flex items-center gap-2 px-2">
                    <Shield class="h-5 w-5 text-primary" />
                    <span class="font-bold">Admin</span>
                </div>
                <button
                    class="btn btn-ghost btn-sm btn-square"
                    aria-label="关闭菜单"
                    @click="mobileMenuOpen = false"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
            <nav class="space-y-1">
                <NuxtLink
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                    active-class="bg-primary/10 text-primary font-medium"
                    @click="mobileMenuOpen = false"
                >
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.label }}
                </NuxtLink>
            </nav>
        </aside>

        <!-- Desktop Layout -->
        <div class="hidden md:flex md:min-h-screen">
            <aside class="w-56 shrink-0 border-r border-base-300 bg-base-100 p-4">
                <div class="flex items-center gap-2 px-2 pb-6">
                    <Shield class="h-5 w-5 text-primary" />
                    <span class="font-bold">Admin</span>
                </div>
                <nav class="space-y-1">
                    <NuxtLink
                        v-for="item in navItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                        active-class="bg-primary/10 text-primary font-medium"
                    >
                        <component :is="item.icon" class="h-4 w-4" />
                        {{ item.label }}
                    </NuxtLink>
                </nav>
            </aside>
            <main class="flex-1 p-6">
                <slot />
            </main>
        </div>

        <!-- Mobile Main Content -->
        <main class="p-4 md:hidden">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Shield, LayoutDashboard, Receipt, Users, Gamepad2, Dices, Menu, X } from "lucide-vue-next";
import type { Component } from "vue";

interface NavItem {
    to: string;
    label: string;
    icon: Component;
}

const navItems: NavItem[] = [
    { to: "/admin", label: "概览", icon: LayoutDashboard },
    { to: "/admin/orders", label: "订单", icon: Receipt },
    { to: "/admin/users", label: "用户", icon: Users },
    { to: "/admin/sessions", label: "陪玩场次", icon: Gamepad2 },
    { to: "/admin/mahjong", label: "麻将", icon: Dices },
];

const mobileMenuOpen = ref(false);
</script>
