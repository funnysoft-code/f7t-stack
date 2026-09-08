import { test, expect, type BrowserContext, type Page } from "@playwright/test";

test("capability outages do not invent registration policy @dependency-failure", async ({
  page,
  context,
}) => {
  await cookies(context, { capabilityOutage: "yes" });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Account unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account", exact: true })).toHaveCount(0);
  await cookies(context, { capabilityOutage: "" });
  await page.getByRole("button", { name: "Retry loading this page" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("an expired confirmation retries the intended mutation only once @confirmation", async ({
  page,
  context,
}) => {
  await cookies(context, { account: "verified" });
  let attempts = 0;
  await page.route("**/api/auth/settings/profile", (route) => {
    attempts++;
    return route.fulfill({ status: 423, json: { message: "Confirmation expired" } });
  });
  await page.goto("/settings/profile");
  await page.getByRole("textbox", { name: "Email address" }).fill("pending@example.test");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Current password", exact: true })
    .fill("fixture-password");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm and continue" }).click();
  await expect(
    page.getByText("Confirmation expired. Try the action again to confirm your identity."),
  ).toBeVisible();
  expect(attempts).toBe(2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveValue(
    "pending@example.test",
  );
});

async function cookies(context: BrowserContext, values: Record<string, string>) {
  await context.addCookies(
    Object.entries(values).map(([name, value]) => ({ name, value, url: "http://localhost:3052" })),
  );
}
async function login(page: Page, email = "browser@example.test") {
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("registration capability, disabled direct entry and stale submission @registration", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Create an account", exact: true })).toHaveCount(0);
  await page.goto("/register");
  await expect(page.getByText("Registration is closed. Return to sign in.")).toBeVisible();
  await cookies(context, { registration: "enabled" });
  await page.goto("/register");
  await page.getByRole("textbox", { name: "Full name" }).fill("Browser account");
  await page.getByRole("textbox", { name: "Email address" }).fill("new@example.test");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("fixture-password");
  await page
    .getByRole("textbox", { name: "Confirm password", exact: true })
    .fill("fixture-password");
  await cookies(context, { registration: "disabled" });
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "no longer available" })).toBeVisible();
  await cookies(context, { registration: "enabled" });
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
});

test("password, factor and recovery continuation @login @two-factor-challenge", async ({
  page,
}) => {
  await page.goto("/login?next=%2Fsettings%2Fsecurity");
  await login(page, "factor@example.test");
  await expect(page).toHaveURL(/two-factor-challenge\?next=%2Fsettings%2Fsecurity/);
  await page.getByRole("button", { name: "Use a recovery code", exact: true }).click();
  await page.getByRole("textbox", { name: "Recovery code", exact: true }).fill("fixture-code");
  await page.getByRole("button", { name: "Verify and sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign-in & security" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("reset password has usable success states @password-reset", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByRole("textbox", { name: "Email address" }).fill("browser@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If an account uses that address/)).toBeVisible();
  await page.goto("/reset-password?token=fixture&email=browser%40example.test");
  await page
    .getByRole("textbox", { name: "New password", exact: true })
    .fill("replacement-password");
  await page
    .getByRole("textbox", { name: "Confirm password", exact: true })
    .fill("replacement-password");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(
    page.getByText("Password reset. You can now sign in with your new password."),
  ).toBeVisible();
});

test("verification, email correction and confirmation @verification @profile @confirmation", async ({
  page,
  context,
}) => {
  await cookies(context, { account: "verified" });
  await page.goto("/settings/profile");
  await page.getByRole("textbox", { name: "Email address" }).fill("corrected@example.test");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Current password", exact: true })
    .fill("fixture-password");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await expect(page.getByText(/A new verification link is on its way/)).toBeVisible();
  await page.getByRole("button", { name: "Wrong email address?" }).click();
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Email address" }).fill("second@example.test");
  await page.getByRole("button", { name: "Update email address" }).click();
  await expect(page.getByText(/Verify second@example.test/)).toBeVisible();
});

test("outages stay distinct from signed out, with retry @dependency-failure", async ({
  page,
  context,
}) => {
  await cookies(context, { account: "verified", outage: "yes" });
  await page.goto("/settings/profile");
  await expect(page.getByRole("heading", { name: "Account unavailable" })).toBeVisible();
  await expect(page.getByText(/Your sign-in status has not been changed/)).toBeVisible();
  await cookies(context, { outage: "" });
  await page.getByRole("button", { name: "Retry loading this page" }).click();
  await expect(page.getByRole("heading", { name: "Personal details" })).toBeVisible();
});

test("password change and deletion after confirmation @password-change @account-deletion", async ({
  page,
  context,
}) => {
  await cookies(context, { account: "verified", confirmed: "yes" });
  await page.goto("/settings/security");
  await page
    .getByRole("textbox", { name: "New password", exact: true })
    .fill("replacement-password");
  await page
    .getByRole("textbox", { name: "Confirm new password", exact: true })
    .fill("replacement-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/Password updated/)).toBeVisible();
  await page.goto("/settings/delete-account");
  await page.getByRole("button", { name: "Delete account", exact: true }).click();
  await expect(page.getByRole("alertdialog").getByRole("button", { name: "Cancel" })).toBeFocused();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
