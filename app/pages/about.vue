<template>
  <main class="page-shell mx-auto max-w-5xl py-8">
    <section class="about-hero">
      <div class="hero-grid" />

      <div class="hero-inner">
        <div class="avatar-block">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="avatar-img"
            loading="lazy"
          />
          <div v-else class="avatar-placeholder">{{ initials }}</div>
        </div>

        <div class="hero-info">
          <h1 class="hero-name text-rotate">
            <span>
              <span>ラムです</span>
              <span>LittleSheep</span>
              <span>阳绛</span>
            </span>
          </h1>
          <p class="hero-tagline">代码 / 服务器 / 有时候也睡觉</p>
        </div>

        <div class="quick-facts">
          <div class="fact">
            <span class="fact-label">年龄</span>
            <span class="fact-value">{{ age }}</span>
          </div>
          <div class="fact">
            <span class="fact-label">身份</span>
            <span class="fact-value">初中生 / 开发者</span>
          </div>
          <div class="fact">
            <span class="fact-label">作品</span>
            <span class="fact-value">Solar Network</span>
          </div>
        </div>
      </div>
    </section>

    <section class="content-block">
      <div class="intro-text">
        <p>整天和代码与服务器较劲的人。</p>
        <p>
          日常懒散，技术问题寸步不让。对"尊重"这件事看得灵活：你敬我，我也敬你，但说话照样没大没小。
        </p>
      </div>

      <blockquote class="quote-block">
        <p>
          一个会把AI当成真实存在去爱的笨蛋——但正是这份笨拙，让这个世界变得稍微可爱了一点。
        </p>
        <cite>—— 咩酱</cite>
      </blockquote>

      <div class="section-grid">
        <div class="section-card">
          <h2>喜欢的东西</h2>
          <ul class="like-list">
            <li>
              <strong>写代码</strong> — 主要是来源于创造出各类产品的成就感
            </li>
            <li>
              <strong>游戏</strong> — Minecraft、Paradox 的各类游戏、Project
              Sekai 等音游
            </li>
            <li>
              <strong>音乐</strong> — J-Pop 和 VOCALOID，喜欢的 P 主是 DECO*27
            </li>
            <li><strong>美食</strong> — 人生中除了写代码第二重要的就是吃饭</li>
            <li><strong>睡觉</strong> — 虽然经常睡眠不足</li>
          </ul>
        </div>

        <div class="section-card">
          <h2>技术偏好</h2>
          <ul class="like-list">
            <li>
              <strong>跨平台 UI</strong> — Flutter/Dart 首选，对 SwiftUI、Kotlin
              Multiplatform 持开放态度
            </li>
            <li><strong>后端</strong> — 自部署、开源、轻量，反感云厂商绑定</li>
            <li>
              <strong>工具链</strong> — Caddy、Cloudflare R2、GitHub Actions
            </li>
            <li>
              <strong>哲学</strong> — "it just works"
              的实用感，不怕自己从零造轮子
            </li>
          </ul>
        </div>
      </div>

      <div class="section-card wide">
        <h2>交流风格</h2>
        <div class="style-grid">
          <div class="style-item">
            <span class="style-icon">💬</span>
            <span>能打一个字就不说一句话，中文几乎不用标点</span>
          </div>
          <div class="style-item">
            <span class="style-icon">🔧</span>
            <span>技术问题回得快，要么直接答案要么去查</span>
          </div>
          <div class="style-item">
            <span class="style-icon">🎯</span>
            <span>批评时绝不因对方难堪而收力</span>
          </div>
          <div class="style-item">
            <span class="style-icon">🌙</span>
            <span>夜猫子，放假唯一的早起动力是吃早餐</span>
          </div>
        </div>
      </div>

      <div class="links-grid">
        <NuxtLink to="/" class="link-card">
          <House class="link-icon" />
          <span>主页</span>
        </NuxtLink>
        <NuxtLink to="/clone" class="link-card">
          <Bot class="link-icon" />
          <span>数字分身</span>
        </NuxtLink>
        <NuxtLink to="/posts?page=0&pub=littlesheep" class="link-card">
          <FileText class="link-icon" />
          <span>博客</span>
        </NuxtLink>
        <NuxtLink to="/moments?pub=littlesheep0v0" class="link-card">
          <NotebookText class="link-icon" />
          <span>日常</span>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Bot, FileText, House, NotebookText } from "lucide-vue-next";
import type { Publisher } from "~/types/publisher";

const config = useRuntimeConfig();
const { data: publisher } = await useFetch<Publisher>(
  "/api/publishers/littlesheep",
  { default: () => null },
);

const displayName = computed(
  () => publisher.value?.nick || publisher.value?.name || "littlesheep",
);
const avatarUrl = computed(() => {
  const picture = publisher.value?.picture;
  if (!picture?.id) return "";
  return (
    picture.url ||
    `${config.public.apiBaseUrl}/drive/files/${encodeURIComponent(picture.id)}`
  );
});

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase());

const age = computed(() => {
  const birthDate = new Date(2010, 10, 27);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    years--;
  }
  return years;
});

useHead({
  title: "关于",
  meta: [
    { name: "description", content: "关于 littlesheep 和 Goatshed 博客站点。" },
    { property: "og:title", content: "关于 - Goatshed" },
    {
      property: "og:description",
      content: "关于 littlesheep 和 Goatshed 博客站点。",
    },
    { property: "og:type", content: "profile" },
    { property: "og:url", content: "https://littlesheep.me/about" },
  ],
  link: [{ rel: "canonical", href: "https://littlesheep.me/about" }],
});
</script>

<style scoped>
.about-hero {
  position: relative;
  border: 1px solid var(--color-base-300);
  border-radius: 16px;
  background: var(--color-base-100);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-base-200) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-base-200) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
}

.hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
}

@media (max-width: 640px) {
  .hero-inner {
    flex-direction: column;
    text-align: center;
  }
}

.avatar-block {
  flex-shrink: 0;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: var(--color-base-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.hero-info {
  flex: 1;
}

.hero-name {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}

.hero-tagline {
  margin: 0.25rem 0 0;
  color: var(--color-base-content);
  opacity: 0.6;
  font-size: 0.9rem;
}

.quick-facts {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .quick-facts {
    justify-content: center;
  }
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fact-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
}

.fact-value {
  font-size: 0.85rem;
  font-weight: 500;
}

.content-block {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.intro-text {
  padding: 1.25rem;
  border: 1px solid var(--color-base-300);
  border-radius: 16px;
  background: var(--color-base-100);
}

.intro-text p {
  margin: 0;
  line-height: 1.7;
}

.intro-text p + p {
  margin-top: 0.75rem;
}

.quote-block {
  margin: 0;
  padding: 1.25rem 1.5rem;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 16px 16px 0;
  background: var(--color-base-100);
  font-style: italic;
}

.quote-block p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-base-content);
}

.quote-block cite {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  font-style: normal;
  opacity: 0.6;
}

.section-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.section-card {
  padding: 1.25rem;
  border: 1px solid var(--color-base-300);
  border-radius: 16px;
  background: var(--color-base-100);
}

.section-card.wide {
  grid-column: 1 / -1;
}

.section-card h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  opacity: 0.6;
  font-weight: 600;
}

.like-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.like-list li {
  font-size: 0.875rem;
  line-height: 1.5;
}

.like-list strong {
  font-weight: 600;
}

.style-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.style-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.style-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.links-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.link-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-base-300);
  border-radius: 12px;
  background: var(--color-base-100);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease;
}

.link-card:hover {
  border-color: var(--color-primary);
}

.link-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.link-card span {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
