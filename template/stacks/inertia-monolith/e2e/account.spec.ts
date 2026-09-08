import { test, expect } from "@playwright/test";
import { accountPage } from "./account-fixture";

test("registration entry follows the server capability and handles a stale denial", async ({
  page,
}) => {
  await accountPage(page, "/login", "auth/login", { account: null });
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveCount(0);
  await accountPage(page, "/register", "auth/register", {
    account: null,
    capabilities: { registrationEnabled: true, registrationUrl: "/register" },
  });
  await page.route("**/register", async (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 403, json: {} })
      : route.fallback(),
  );
  await page.getByLabel("Full name", { exact: true }).fill("Alex Lee");
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByLabel("Confirm password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("not available");
});

test("login validation is labelled, JSON-only and keyboard-recoverable", async ({ page }) => {
  await accountPage(page, "/login", "auth/login", { account: null });
  await page.route("**/login", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    expect(route.request().headers()["x-inertia"]).toBeUndefined();
    expect(route.request().headers().accept).toBe("application/json");
    await route.fulfill({
      status: 422,
      json: {
        message: "Check your email and password.",
        errors: { email: ["These credentials do not match our records."] },
      },
    });
  });
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Email address", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("[data-feedback]")).toBeFocused();
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
});

test("mobile forms fit and loading prevents repeated submission", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await accountPage(page, "/forgot-password", "auth/forgot-password", { account: null });
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/forgot-password", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await gate;
    await route.fulfill({ json: { status: "sent" } });
  });
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.test");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("button", { name: "Working…", exact: false })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  release?.();
  await expect(page.getByRole("status")).toContainText("a reset link is on its way");
});
