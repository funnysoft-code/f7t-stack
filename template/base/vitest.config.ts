import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}", "packages/*/**/*.{ts,tsx}"],
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
