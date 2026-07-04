<template>
    <div class="flex min-h-screen">
        <aside class="w-56 shrink-0 border-r border-base-300 bg-base-100 p-4">
            <div class="flex items-center gap-2 px-2 pb-6">
                <Shield class="h-5 w-5 text-primary" />
                <span class="font-bold">Admin</span>
            </div>
            <nav class="space-y-1">
                <NuxtLink
                    to="/admin"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                    active-class="bg-primary/10 text-primary font-medium"
                >
                    <LayoutDashboard class="h-4 w-4" />
                    概览
                </NuxtLink>
                <NuxtLink
                    to="/admin/orders"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                    active-class="bg-primary/10 text-primary font-medium"
                >
                    <Receipt class="h-4 w-4" />
                    订单
                </NuxtLink>
                <NuxtLink
                    to="/admin/users"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                    active-class="bg-primary/10 text-primary font-medium"
                >
                    <Users class="h-4 w-4" />
                    用户
                </NuxtLink>
                <NuxtLink
                    to="/admin/sessions"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                    active-class="bg-primary/10 text-primary font-medium"
                >
                    <Gamepad2 class="h-4 w-4" />
                    陪玩场次
                </NuxtLink>
            </nav>
        </aside>
        <main class="flex-1 p-6">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { Shield, LayoutDashboard, Receipt, Users, Gamepad2 } from "lucide-vue-next";
</script>
