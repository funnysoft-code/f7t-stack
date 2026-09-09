import { defineConfig } from "vite-plus";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { wayfinder } from "@laravel/vite-plugin-wayfinder";

export default defineConfig({
  resolve: { alias: { "@": new URL("./resources/js", import.meta.url).pathname } },
  lint: {
    ignorePatterns: [
      "resources/js/actions/**",
      "resources/js/routes/**",
      "resources/js/wayfinder/**",
      "resources/js/types/generated.d.ts",
    ],
  },
  fmt: {
    ignorePatterns: [
      "resources/js/actions/**",
      "resources/js/routes/**",
      "resources/js/wayfinder/**",
      "resources/js/types/generated.d.ts",
    ],
  },
  plugins: [
    laravel({ input: ["resources/css/app.css", "resources/js/app.tsx"], refresh: true }),
    react(),
    tailwindcss(),
    wayfinder({ formVariants: true }),
  ],
});
