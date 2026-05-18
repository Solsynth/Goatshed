import tailwindcss from "@tailwindcss/vite";

const nitroDataDir = process.env.NITRO_DATA_DIR?.trim() || ".data";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/eslint", "nuxt-shiki"],
  shiki: {
    dynamic: true,
    bundledLangs: ["cpp"],
    bundledThemes: ["github-light", "github-dark", "ayu-light", "ayu-mirage"],
  },
  experimental: {
    viewTransition: true,
  },
  css: ["~/assets/css/main.css"],
  site: {
    url: "https://littlesheep.me",
    name: "Goatshed 山羊寒舍",
    description:
      "LittleSheep's personal blog powered by Solar Network. About tech, programming, and life.",
  },
  app: {
    head: {
      title: "Goatshed",
      titleTemplate: "%s - Goatshed",
      htmlAttrs: {
        lang: "zh-CN",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "A stylish personal blog powered by Solar Network.",
        },
        {
          name: "keywords",
          content: "littlesheep, blog, developer, Solar Network",
        },
        { name: "author", content: "littlesheep" },
        { name: "theme-color", content: "#6366f1" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Goatshed" },
        {
          property: "og:title",
          content: "Goatshed - littlesheep's Personal Blog",
        },
        {
          property: "og:description",
          content:
            "A stylish personal blog powered by Solar Network.",
        },
        {
          property: "og:image",
          content: "https://littlesheep.me/og-image.png",
        },
        { property: "og:url", content: "https://littlesheep.me" },
        { property: "og:locale", content: "zh_CN" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Goatshed - littlesheep's Personal Blog",
        },
        {
          name: "twitter:description",
          content:
            "A stylish personal blog powered by Solar Network.",
        },
        {
          name: "twitter:image",
          content: "https://littlesheep.me/og-image.png",
        },
      ],
      script: [
        {
          defer: true,
          src: "https://cloud.umami.is/script.js",
          "data-website-id": "43beabf3-549a-44ac-add8-8d64229c01e5",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap",
        },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "canonical", href: "https://littlesheep.me" },
      ],
    },
  },
  runtimeConfig: {
    authSessionSecret: "replace-this-in-production",
    oauthClientSecret: "",
    public: {
      apiBaseUrl: "https://api.solian.app",
      oauthClientId: "",
      oauthAuthorizeUrl: "https://id.solian.app/auth/authorize",
      oauthTokenUrl: "https://api.solian.app/padlock/auth/open/token",
      oauthUserInfoUrl: "https://api.solian.app/padlock/auth/open/userinfo",
      oauthRedirectUrl: "",
      oauthScope: "openid profile email",
      oauthProviderName: "Solarpass",
    },
  },
  nitro: {
    storage: {
      data: {
        driver: "fs",
        base: nitroDataDir,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
