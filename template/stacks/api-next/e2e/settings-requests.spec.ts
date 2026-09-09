import { test, expect } from "@playwright/test";

test.use({ screenshot: "off", trace: "off" });

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies(
    Object.entries({ account: "verified", confirmed: "yes", factor: "confirmed" }).map(
      ([name, value]) => ({ name, value, url: baseURL! }),
    ),
  );
});

for (const staleStatus of [200, 503]) {
  test(`enrollment survives a late initial passkey response (${staleStatus}) @passkeys`, async ({
    page,
    context,
    baseURL,
  }) => {
    const initial = deferred();
    let reads = 0;
    await page.route("**/api/auth/user/passkeys", async (route) => {
      if (route.request().method() === "POST")
        return route.fulfill({ json: { uuid: "fixture-key", name: "Regression device" } });
      if (++reads === 1) {
        await initial.promise;
        return route.fulfill({ status: staleStatus, json: { data: [] } });
      }
      return route.fulfill({
        json: { data: [{ uuid: "fixture-key", name: "Regression device", last_used_at: null }] },
      });
    });
    await page.route("**/api/auth/user/passkeys/options", (route) =>
      route.fulfill({
        json: {
          options: {
            challenge: "YWJjZGVmZ2hpamtsbW5vcA",
            rp: { name: "Regression", id: new URL(baseURL!).hostname },
            user: { id: "dXNlcg", name: "fixture", displayName: "Fixture" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          },
        },
      }),
    );
    const cdp = await context.newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    await page.goto("/settings/passkeys");
    await expect.poll(() => reads).toBe(1);
    await page.getByLabel("Passkey name", { exact: true }).fill("Regression device");
    await page.getByRole("button", { name: "Add a passkey", exact: true }).click();
    await expect(page.getByText("Regression device", { exact: true })).toBeVisible();
    const delivered = page.waitForResponse(
      (response) =>
        response.url().endsWith("/user/passkeys") && response.request().method() === "GET",
    );
    initial.resolve();
    await (await delivered).finished();
    // Let React commit the released fetch, rather than asserting before its continuation.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page.getByText("Regression device", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry loading passkeys" })).toHaveCount(0);
  });
}

test("rotation clears obsolete codes before replacement reads and retries only the read @recovery-codes", async ({
  page,
}) => {
  const rotation = deferred();
  const replacement = deferred();
  let writes = 0;
  let reads = 0;
  await page.route("**/api/auth/user/two-factor-recovery-codes", async (route) => {
    if (route.request().method() === "POST") {
      writes++;
      await rotation.promise;
      return route.fulfill({ status: 204, body: "" });
    }
    if (++reads === 2) {
      await replacement.promise;
      return route.fulfill({ status: 503, json: {} });
    }
    return route.fulfill({ json: [reads === 1 ? "obsolete-test-code" : "replacement-test-code"] });
  });
  await page.goto("/settings/recovery");
  await page.getByRole("button", { name: "Show recovery codes" }).click();
  await expect(page.getByRole("list", { name: "Recovery codes" })).toBeVisible();
  await page.getByRole("button", { name: "Generate new codes", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Generate new codes", exact: true })
    .click();
  await expect.soft(page.getByRole("button", { name: "Copy codes", exact: true })).toBeDisabled();
  rotation.resolve();
  await expect.poll(() => reads).toBe(2);
  await expect(page.getByRole("list", { name: "Recovery codes" })).toHaveCount(0);
  replacement.resolve();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy codes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry loading recovery codes" }).click();
  await expect(page.getByRole("list", { name: "Recovery codes" })).toBeVisible();
  expect(
    await page
      .locator(".recovery-codes")
      .evaluate((list) => list.textContent?.includes("obsolete-test-code")),
  ).toBe(false);
  expect(writes).toBe(1);
  expect(reads).toBe(3);
});
