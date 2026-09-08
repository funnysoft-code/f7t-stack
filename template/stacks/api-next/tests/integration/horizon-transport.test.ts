import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium } from "@playwright/test";
import { startServers, type TransportServers } from "./servers";

describe("native Horizon through real Next and Laravel", () => {
  let servers: TransportServers;
  beforeAll(async () => {
    servers = await startServers(4317);
  }, 120_000);
  afterAll(async () => {
    await servers?.close();
  }, 30_000);

  it("separates guest navigation, internal requests, verification and permission denial", async () => {
    const session = servers.session();
    const guest = await session.request("/horizon/jobs/pending", {
      headers: { accept: "text/html" },
    });
    expect(guest.status).toBe(302);
    expect(guest.headers.get("location")).toBe(
      `${servers.frontend}/login?next=%2Fhorizon%2Fjobs%2Fpending`,
    );
    expect(guest.headers.get("cache-control")).toContain("no-store");
    expect(guest.headers.getSetCookie().length).toBeGreaterThanOrEqual(2);
    expect(
      (await session.request("/horizon/api/stats", { headers: { accept: "text/html" } })).status,
    ).toBe(401);
    expect((await servers.login(session, "unverified")).status).toBe(200);
    servers.permission("unverified", true);
    const unverified = await session.request("/horizon", { headers: { accept: "text/html" } });
    expect(unverified.status).toBe(302);
    expect(unverified.headers.get("location")).toBe(
      `${servers.frontend}/verify-email?next=%2Fhorizon`,
    );
    expect((await session.request("/horizon/api/stats")).status).toBe(403);
    const denied = servers.session();
    expect((await servers.login(denied, "second")).status).toBe(200);
    expect((await denied.request("/horizon", { headers: { accept: "text/html" } })).status).toBe(
      403,
    );
    const internal = await denied.request("/horizon/api/stats");
    expect(internal.status).toBe(403);
    expect(internal.headers.get("content-type")).toContain("application/json");
  }, 60_000);

  it("serves embedded native assets, reloads, polling and CSRF-protected mutations; revocation applies immediately", async () => {
    const session = servers.session();
    expect((await servers.login(session)).status).toBe(200);
    servers.permission("first", true);
    for (const path of ["/horizon", "/horizon/dashboard", "/horizon/jobs/pending"]) {
      const response = await session.request(path, { headers: { accept: "text/html" } });
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("no-store");
      const html = await response.text();
      // Boolean assertions keep the embedded CSRF token out of failure output.
      expect(html.includes('id="horizon"')).toBe(true);
      expect(html.includes('<style data-scheme="light"')).toBe(true);
      expect(html.includes('<script type="module"')).toBe(true);
      expect(html.includes("window.Horizon =")).toBe(true);
      expect(/(?:src|href)=["'](?:https?:\/\/[^/]+)?\/vendor\/horizon/.test(html)).toBe(false);
    }
    const denied = servers.session();
    expect((await servers.login(denied, "second")).status).toBe(200);
    const isolated = await Promise.all(
      [session, denied, session, denied].map((user) =>
        user.request("/horizon", { headers: { accept: "text/html" } }),
      ),
    );
    expect(isolated.map((response) => response.status)).toEqual([200, 403, 200, 403]);
    for (const [index, response] of isolated.entries()) {
      expect((await response.text()).includes('id="horizon"')).toBe(index % 2 === 0);
    }
    expect(
      isolated.every((response) => response.headers.get("cache-control")?.includes("no-store")),
    ).toBe(true);
    const stats = await session.request("/horizon/api/stats");
    expect(stats.status).toBe(200);
    expect(stats.headers.get("content-type")).toContain("application/json");
    expect(stats.headers.get("cache-control")).toContain("no-store");
    for (const origin of [undefined, "https://attacker.test"]) {
      expect(
        (
          await session.request("/horizon/api/monitoring", {
            method: "POST",
            headers: origin ? { origin } : {},
          })
        ).status,
      ).toBe(403);
    }
    for (const token of [undefined, "invalid"]) {
      expect(
        (
          await session.request("/horizon/api/monitoring", {
            method: "POST",
            headers: { origin: servers.frontend, ...(token ? { "x-xsrf-token": token } : {}) },
          })
        ).status,
      ).toBe(419);
    }
    expect((await session.mutate("/horizon/api/monitoring", { tag: "u16-harmless" })).status).toBe(
      200,
    );
    servers.permission("first", false);
    expect((await session.request("/horizon/api/stats")).status).toBe(403);
    expect((await session.mutate("/horizon/api/monitoring", { tag: "u16-revoked" })).status).toBe(
      403,
    );
    expect((await session.request("/horizon", { headers: { accept: "text/html" } })).status).toBe(
      403,
    );
    servers.permission("first", true);
    expect((await session.request("/horizon/api/stats")).status).toBe(200);
    expect((await session.mutate("/api/auth/logout")).status).toBe(204);
    expect(
      (await session.request("/horizon/dashboard", { headers: { accept: "text/html" } })).status,
    ).toBe(302);
    expect((await session.request("/horizon/api/stats")).status).toBe(401);
  }, 60_000);

  it("renders the selected native dashboard and uses only its declared frontend network mount in Chromium", async () => {
    const browser = await chromium.launch({ executablePath: process.env.F7T_CHROMIUM_EXECUTABLE });
    try {
      const page = await browser.newPage();
      expect(await servers.loginInBrowser(page)).toBe(200);
      servers.permission("first", true);
      const requests: Array<{ url: string; status: number }> = [];
      let scriptErrors = 0;
      page.on("response", (response) =>
        requests.push({ url: response.url(), status: response.status() }),
      );
      page.on("pageerror", () => {
        scriptErrors++;
      });
      const stats = page.waitForResponse(
        (response) => response.url() === `${servers.frontend}/horizon/api/stats`,
      );
      await page.goto(`${servers.frontend}/horizon`, { waitUntil: "domcontentloaded" });
      expect((await stats).status()).toBe(200);
      await page.getByRole("link", { name: "Pending Jobs" }).click();
      await page.waitForURL("**/horizon/jobs/pending");
      expect((await page.reload())?.status()).toBe(200);
      expect(await page.locator("#horizon").isVisible()).toBe(true);
      expect(await page.locator('style[data-scheme="light"]').count()).toBe(1);
      expect(scriptErrors).toBe(0);
      const local = requests.filter(({ url }) => new URL(url).origin === servers.frontend);
      expect(local.some(({ url }) => url.endsWith("/horizon/api/stats"))).toBe(true);
      expect(
        local.every(
          ({ url, status }) => new URL(url).pathname.startsWith("/horizon") && status === 200,
        ),
      ).toBe(true);
      expect(
        requests
          .filter(({ url }) => new URL(url).origin !== servers.frontend)
          .every(({ url }) => new URL(url).hostname === "fonts.bunny.net"),
      ).toBe(true);
      servers.permission("first", false);
      expect(await page.evaluate(async () => (await fetch("/horizon/api/stats")).status)).toBe(403);
      expect((await page.reload())?.status()).toBe(403);
    } finally {
      await browser.close();
    }
  }, 60_000);

  it("expires sessions and reports outages without cached dashboard responses", async () => {
    const session = servers.session();
    expect((await servers.login(session)).status).toBe(200);
    servers.expireSessions();
    expect((await session.request("/horizon", { headers: { accept: "text/html" } })).status).toBe(
      302,
    );
    expect((await session.request("/horizon/api/stats")).status).toBe(401);
    await servers.outage();
    const response = await session.request("/horizon", { headers: { accept: "text/html" } });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
