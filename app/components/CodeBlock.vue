<template>
  <div class="mockup-code w-full text-base leading-relaxed" :class="containerClass">
    <Shiki
      :lang="lang"
      :highlight-options="highlightOptions"
      :code="code"
      as="pre"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  code: string;
  lang?: string;
  themes?: {
    light?: string;
    dark?: string;
  };
  containerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lang: "plaintext",
  themes: () => ({
    light: "github-light",
    dark: "github-dark",
  }),
  containerClass: "",
});

const highlightOptions = computed(() => ({
  themes: props.themes,
}));
</script>

<style scoped>
.mockup-code :deep(pre) {
  padding-left: 1.25rem;
}

.mockup-code :deep(pre):before {
  margin-right: 0;
}
</style>
