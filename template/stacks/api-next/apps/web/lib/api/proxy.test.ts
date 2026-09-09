import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { proxyRequest } from "./proxy";
import { dashboardContinuation, isApiPath } from "./paths";

const frontend = "http://127.0.0.1:4316";
const upstream = "http://127.0.0.1:8316";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function configure() {
  vi.stubEnv("FRONTEND_URL", frontend);
  vi.stubEnv("API_UPSTREAM_URL", upstream);
}

describe("fixed session proxy", () => {
  it("preserves separate cookies and browser credentials without forwarding routing headers", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: [
          ["set-cookie", "one=a; Path=/; HttpOnly"],
          ["set-cookie", "two=b; Path=/"],
        ],
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const response = await proxyRequest(
      new Request(`${frontend}/api/auth/csrf-cookie`, {
        headers: {
          cookie: "one=a",
          origin: frontend,
          referer: `${frontend}/login`,
          "x-forwarded-host": "attacker.test",
          authorization: "Bearer rejected",
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(`${upstream}/api/auth/csrf-cookie`);
    expect(init.headers.get("cookie")).toBe("one=a");
    expect(init.headers.get("origin")).toBe(frontend);
    expect(init.headers.get("referer")).toBe(`${frontend}/login`);
    expect(init.headers.has("x-forwarded-host")).toBe(false);
    expect(init.headers.has("authorization")).toBe(false);
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("manual");
  });

  it.each([undefined, "null", "https://attacker.test", `${frontend}/`])(
    "rejects mutation Origin %s before reaching Laravel",
    async (origin) => {
      configure();
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      const response = await proxyRequest(
        new Request(`${frontend}/api/auth/logout`, {
          method: "POST",
          headers: origin ? { origin } : {},
        }),
      );
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("preserves a mutation body and CSRF header", async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ message: "invalid" }, { status: 419 }));
    vi.stubGlobal("fetch", fetcher);
    const response = await proxyRequest(
      new Request(`${frontend}/api/auth/login`, {
        method: "POST",
        headers: {
          origin: frontend,
          referer: `${frontend}/login`,
          "x-xsrf-token": "test-token",
          "content-type": "application/json",
        },
        body: '{"email":"fixture@example.test"}',
      }),
    );
    expect(response.status).toBe(419);
    const init = fetcher.mock.calls[0][1];
    expect(init.headers.get("x-xsrf-token")).toBe("test-token");
    expect(new TextDecoder().decode(init.body)).toBe('{"email":"fixture@example.test"}');
  });

  it.each(["https://attacker.test/login", "invalid"])(
    "rejects a contradictory Referer %s",
    async (referer) => {
      configure();
      vi.stubGlobal("fetch", vi.fn());
      expect(
        (
          await proxyRequest(
            new Request(`${frontend}/api/auth/logout`, {
              method: "POST",
              headers: { origin: frontend, referer },
            }),
          )
        ).status,
      ).toBe(403);
    },
  );

  it("allows same-origin mutations when browser policy omits Referer", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const response = await proxyRequest(
      new Request(`${frontend}/api/auth/logout`, { method: "POST", headers: { origin: frontend } }),
    );
    expect(response.status).toBe(204);
  });

  it("does not manufacture Origin on native dashboard navigation", async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response("<html></html>", { headers: { "content-type": "text/html" } }),
      );
    vi.stubGlobal("fetch", fetcher);
    const response = await proxyRequest(
      new Request(`${frontend}/horizon/dashboard`, { headers: { accept: "text/html" } }),
    );
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(fetcher.mock.calls[0][1].headers.has("origin")).toBe(false);
    expect(fetcher.mock.calls[0][1].headers.get("accept")).toBe("text/html");
  });

  it.each(["/api/%252e%252e/private", "/api/%2f%2fattacker.test", "/api/%5cprivate", "/private"])(
    "rejects path escape %s",
    async (path) => {
      configure();
      vi.stubGlobal("fetch", vi.fn());
      expect((await proxyRequest(new Request(`${frontend}${path}`))).status).toBe(400);
    },
  );

  it.each([
    `${upstream}/horizon/dashboard`,
    "/horizon/dashboard",
    "/login?next=%2Fhorizon%2Fdashboard",
    "/verify-email?next=%2Fhorizon",
  ])("keeps allowed redirect on frontend: %s", async (location) => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 302, headers: { location, "set-cookie": "one=a; Path=/" } }),
        ),
    );
    const response = await proxyRequest(new Request(`${frontend}/horizon`));
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("location")!).origin).toBe(frontend);
    expect(response.headers.getSetCookie()).toHaveLength(1);
  });

  it.each([
    "https://attacker.test/horizon",
    "http://[",
    "//attacker.test/horizon",
    "/horizon/%252f%252fattacker.test",
    "/login?next=https%3A%2F%2Fattacker.test",
    "/private",
  ])("rejects unsafe redirect %s", async (location) => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 302, headers: { location, "set-cookie": "one=a; Path=/" } }),
        ),
    );
    const response = await proxyRequest(new Request(`${frontend}/horizon`));
    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toHaveLength(1);
  });

  it("returns a private service error on outage", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private upstream details")));
    const response = await proxyRequest(new Request(`${frontend}/api/auth/me`));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).not.toContain("private upstream details");
  });
});

describe("local continuations", () => {
  it.each([
    "https://attacker.test",
    "//attacker.test",
    "/horizon/../api/auth/me",
    "/horizon/%2e%2e/api",
    "/horizon/api/stats",
    "/horizon#outside",
    "/horizon/%zz",
    "/horizon//attacker",
    "/horizon/\\attacker",
    "/horizons",
    "/horizon/%00",
    "/horizon/%7f",
    "/horizon/line\nfeed",
    "/horizon/%23fragment",
  ])("rejects %s", (path) => {
    expect(dashboardContinuation(path)).toBeNull();
  });
  it("accepts local dashboard deep links and preserves signed API queries", () => {
    expect(dashboardContinuation("/horizon/jobs/pending?page=2")).toBe(
      "/horizon/jobs/pending?page=2",
    );
    expect(isApiPath("/api/auth/email/verify/uuid/hash?expires=1&signature=abc")).toBe(true);
    expect(isApiPath("/api")).toBe(false);
  });
});
