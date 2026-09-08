import { test, expect } from "@playwright/test";

test("unsupported and cancelled passkeys keep password usable @passkeys", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    Object.defineProperty(window, "PublicKeyCredential", { value: undefined, configurable: true });
  });
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(page.locator("[data-feedback]")).toContainText(
    "This browser does not support passkeys",
  );
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeEnabled();
  await page.reload();
  await page.evaluate(() => {
    Object.defineProperty(navigator.credentials, "get", {
      value: async () => {
        throw new DOMException("Cancelled", "NotAllowedError");
      },
    });
  });
  await page.route("**/api/auth/passkeys/login/options", (route) =>
    route.fulfill({
      json: { options: { challenge: "dGVzdA", rpId: "localhost", userVerification: "required" } },
    }),
  );
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(page.locator("[data-feedback]")).toContainText("Passkey request cancelled");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeEnabled();
});

test("authenticator setup, recovery and removal @authenticator @recovery-codes", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "account", value: "verified", url: "http://localhost:3052" },
    { name: "confirmed", value: "yes", url: "http://localhost:3052" },
  ]);
  await page.goto("/settings/authenticator");
  await page.getByRole("button", { name: "Set up authenticator", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Manual setup key" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Scan this QR code with your authenticator app" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Authenticator code", exact: true }).fill("123456");
  await page.getByRole("button", { name: "Confirm authenticator", exact: true }).click();
  await page.getByRole("button", { name: "Show recovery codes", exact: true }).click();
  await expect(page.getByRole("list", { name: "Recovery codes" })).toBeVisible();
  await page.getByRole("button", { name: "Generate new codes", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Generate new codes", exact: true })
    .click();
  await expect(page.getByText(/New recovery codes generated/)).toBeVisible();
  await page.goto("/settings/authenticator");
  await page.getByRole("button", { name: "Remove authenticator", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove authenticator", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Set up an authenticator", exact: true }),
  ).toBeVisible();
});
