import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/web/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "apps/web/lib/**/*.{ts,tsx}",
        "apps/web/src/lib/**/*.{ts,tsx}",
        "packages/api-client/**/*.{ts,tsx}",
        "packages/design-system/**/*.{ts,tsx}",
      ],
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
