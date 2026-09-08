import { test, expect } from "@playwright/test";
import { accountPage } from "./account-fixture";

test("a cancelled browser prompt leaves password sign-in available", async ({ page }) => {
  await accountPage(page, "/login", "auth/login", { account: null });
  await page.route("**/passkeys/login/options", (route) =>
    route.fulfill({
      json: {
        options: {
          challenge: "YWJjZGVmZ2hpamtsbW5vcA",
          rpId: "localhost",
          userVerification: "required",
        },
      },
    }),
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.credentials, "get", {
      configurable: true,
      value: async () => {
        throw new DOMException("User cancelled", "NotAllowedError");
      },
    });
  });
  await page.getByRole("button", { name: "Sign in with a passkey", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("cancelled");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
});

test("password change confirms and retries once, retaining field values", async ({ page }) => {
  let attempts = 0;
  await accountPage(page, "/settings/security", "settings/security");
  await page.route("**/settings/password", async (route) => {
    attempts++;
    await route.fulfill(attempts === 1 ? { status: 423, json: {} } : { status: 204, body: "" });
  });
  await page.route("**/user/confirm-password", async (route) =>
    route.fulfill({ status: 201, json: {} }),
  );
  await page.getByLabel("New password", { exact: true }).fill("new-test-password");
  await page.getByLabel("Confirm new password", { exact: true }).fill("new-test-password");
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Current password", { exact: true }).fill("old-test-password");
  await page.getByRole("button", { name: "Confirm and continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Password updated");
  expect(attempts).toBe(2);
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("");
});

test("empty passkeys and unsupported WebAuthn keep password fallback usable", async ({ page }) => {
  await page.route("**/user/passkeys", async (route) => route.fulfill({ json: { data: [] } }));
  await accountPage(page, "/settings/passkeys", "settings/passkeys");
  await expect(page.getByText("No passkeys yet", { exact: true })).toBeVisible();
  await accountPage(page, "/login", "auth/login", { account: null });
  await page.evaluate(() => {
    Object.defineProperty(window, "PublicKeyCredential", { value: undefined, configurable: true });
  });
  await page.getByRole("button", { name: "Sign in with a passkey", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("not supported");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
});

test("destructive dialog focuses cancel and returns focus without mutation", async ({ page }) => {
  await accountPage(page, "/settings/delete", "settings/delete-account");
  const trigger = page.getByRole("button", { name: "Delete account", exact: true });
  await trigger.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
