import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: "http://localhost:3052",
    trace: "off",
    screenshot: "off",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: "node e2e/backend.mjs",
      url: "http://127.0.0.1:8052/up",
      reuseExistingServer: false,
    },
    {
      command: "bun run build && bun run start --port 3052",
      url: "http://localhost:3052/health",
      timeout: 120000,
      reuseExistingServer: false,
      env: { FRONTEND_URL: "http://localhost:3052", API_UPSTREAM_URL: "http://127.0.0.1:8052" },
    },
  ],
});
