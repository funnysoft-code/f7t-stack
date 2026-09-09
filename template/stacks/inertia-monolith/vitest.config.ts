import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["resources/js/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["resources/js/lib/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/*.{test,spec}.{ts,tsx}",
        "**/generated/**",
        "**/mocks/**",
        "**/node_modules/**",
        "**/*.config.{ts,js}",
        "**/tokens/**",
        "**/fixtures/**",
      ],
      thresholds: { lines: 100 },
    },
  },
});
