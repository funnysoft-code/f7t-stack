import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startServers, type TransportServers } from "./servers";

describe("real Next and Laravel session transport", () => {
  let servers: TransportServers;
  beforeAll(async () => {
    servers = await startServers(4316);
  }, 120_000);
  afterAll(async () => {
    await servers?.close();
  }, 30_000);

  it("rotates cookies across CSRF, login and logout and isolates concurrent SSR identities", async () => {
    const first = servers.session();
    const csrf = await first.request("/api/auth/csrf-cookie");
    expect(csrf.status).toBe(204);
    const cookies = csrf.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThanOrEqual(2);
    expect(cookies.every((cookie) => /path=\//i.test(cookie) && !/domain=/i.test(cookie))).toBe(
      true,
    );
    expect(cookies.some((cookie) => /httponly/i.test(cookie))).toBe(true);
    const guestCookies = first.cookie();
    const login = await servers.login(first, "first", true);
    expect(login.status).toBe(200);
    expect(login.headers.getSetCookie().length).toBeGreaterThanOrEqual(3);
    expect(first.cookie() === guestCookies).toBe(false);
    const second = servers.session();
    expect((await servers.login(second, "second")).status).toBe(200);
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        (i % 2 ? second : first).request("/transport-identity", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    );
    for (const [index, response] of responses.entries()) {
      const html = await response.text();
      expect(html).toContain(index % 2 ? servers.emails.second : servers.emails.first);
      expect(html).not.toContain(index % 2 ? servers.emails.first : servers.emails.second);
      expect(html).toContain(servers.frontend);
      expect(html).not.toContain("https://attacker.test");
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    const token = first.csrf();
    const loggedIn = first.cookie();
    expect((await first.mutate("/api/auth/logout")).status).toBe(204);
    expect(first.csrf() === token).toBe(false);
    expect(first.cookie() === loggedIn).toBe(false);
    expect((await first.request("/api/auth/me")).status).toBe(401);
    const stale = await fetch(`${servers.frontend}/api/auth/me`, { headers: { cookie: loggedIn } });
    expect(stale.status).toBe(401);
    expect((await second.request("/api/auth/me")).status).toBe(200);
  }, 60_000);

  it("rejects missing/cross Origin and missing/invalid CSRF mutations while preserving auth distinctions", async () => {
    const session = servers.session();
    expect((await servers.login(session, "unverified")).status).toBe(200);
    expect((await session.request("/api/auth/me")).status).toBe(200);
    expect((await session.request("/api/app")).status).toBe(403);
    for (const origin of [undefined, "https://attacker.test"]) {
      const response = await session.request("/api/auth/logout", {
        method: "POST",
        headers: origin ? { origin } : {},
      });
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    for (const token of [undefined, "invalid"]) {
      const response = await session.request("/api/auth/logout", {
        method: "POST",
        headers: { origin: servers.frontend, ...(token ? { "x-xsrf-token": token } : {}) },
      });
      expect(response.status).toBe(419);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(1);
    }
    expect((await session.request("/api/auth/me")).status).toBe(200);
  });

  it("preserves real browser Origin/Referer and bounds paths and redirect continuations", async () => {
    const session = servers.session();
    const referer = `${servers.frontend}/login`;
    const headers = await session.request("/api/transport/headers", {
      headers: { origin: servers.frontend, referer },
    });
    expect(await headers.json()).toEqual({ origin: servers.frontend, referer });
    expect(await (await session.request("/api/transport/headers")).json()).toEqual({
      origin: null,
      referer: null,
    });
    for (const path of ["/api/%252f%252fattacker.test", "/api/%5coutside"]) {
      expect((await session.request(path)).status).toBe(400);
    }
    for (const destination of [
      "https://attacker.test/horizon",
      "//attacker.test/horizon",
      "/horizon/%252f%252fattacker.test",
      "/login?next=https%3A%2F%2Fattacker.test",
    ]) {
      const response = await session.request(
        `/api/transport/redirect?to=${encodeURIComponent(destination)}`,
      );
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(2);
    }
    const redirect = await session.request(
      `/api/transport/redirect?to=${encodeURIComponent(`${servers.upstream}/horizon/dashboard`)}`,
    );
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe(`${servers.frontend}/horizon/dashboard`);
  });

  it("distinguishes expired sessions from an unavailable backend", async () => {
    const session = servers.session();
    expect((await servers.login(session)).status).toBe(200);
    servers.expireSessions();
    expect((await session.request("/api/auth/me")).status).toBe(401);
    await servers.outage();
    const response = await session.request("/api/auth/me");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ error: "backend_unavailable" });
    expect(await (await session.request("/transport-identity")).text()).toContain(
      "backend_unavailable",
    );
  });
});
