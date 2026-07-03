<template>
    <div class="rounded-box border border-base-300 bg-base-100 p-4">
        <div class="flex items-center gap-3">
            <div class="avatar">
                <div class="h-10 w-10 rounded-full">
                    <img
                        :src="avatarUrl"
                        :alt="name"
                        loading="lazy"
                    />
                </div>
            </div>
            <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">{{ name }}</div>
                <div class="text-xs text-base-content/50">{{ date }}</div>
            </div>
        </div>
        <p v-if="message" class="mt-2 text-sm text-base-content/70">
            "{{ message }}"
        </p>
        <div class="mt-2 text-right">
            <span class="badge badge-primary">{{ amount }} {{ currency }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    name: string;
    avatarUrl: string;
    amount: string;
    currency: string;
    message?: string | null;
    date: string;
}>();
</script>
