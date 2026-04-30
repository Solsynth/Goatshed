<template>
  <div class="min-h-screen bg-base-100">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: "zh-CN",
  },
});
</script>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(root) {
  animation-name: blur-out;
}

::view-transition-new(root) {
  animation-name: blur-in;
}

::view-transition-old(breadcrumb),
::view-transition-new(breadcrumb) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(breadcrumb) {
  animation-name: breadcrumb-out;
}

::view-transition-new(breadcrumb) {
  animation-name: breadcrumb-in;
}

@keyframes blur-out {
  from {
    opacity: 1;
    filter: blur(0);
  }
  to {
    opacity: 0;
    filter: blur(8px);
  }
}

@keyframes blur-in {
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes breadcrumb-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-12px);
  }
}

@keyframes breadcrumb-in {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
