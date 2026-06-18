import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config
import { env } from "node:process";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/a11y",
    "@nuxtjs/shopify",
    "@nuxt/icon",
    "@vueuse/nuxt",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["./app/assets/css/main.css"],

  typescript: {
    tsConfig: {
      compilerOptions: {
        forceConsistentCasingInFileNames: false,
      },
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },
  shopify: {
    name: "puzzled-9854",
    clients: {
      storefront: {
        apiVersion: env.SHOPIFY_API_VERSION,
        publicAccessToken: env.SHOPIFY_PUBLIC_TOKEN,
        // privateAccessToken: env.SHOPIFY_PRIVATE_TOKEN,
      },
    },
  },
});
