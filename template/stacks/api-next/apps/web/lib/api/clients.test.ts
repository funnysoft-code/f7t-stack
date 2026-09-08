import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const incoming = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: incoming }));

import { browserRequest, initializeCsrf } from "./browser";
import { serverRead } from "./server";
import { transportConfiguration } from "./proxy";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("browser session adapter", () => {
  it("initializes CSRF on the committed auth mount", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    expect((await initializeCsrf()).status).toBe(204);
    const [path, init] = fetcher.mock.calls[0];
    expect(path).toBe("/api/auth/csrf-cookie");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("error");
    expect(init.headers.get("accept")).toBe("application/json");
  });
  it("URL-decodes the current XSRF cookie on each mutation without overriding request data", async () => {
    vi.stubGlobal("document", { cookie: "other=value; XSRF-TOKEN=test%3Dtoken" });
    const fetcher = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetcher);
    await browserRequest("/api/auth/login", {
      method: "post",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    expect(fetcher.mock.calls[0][1].headers.get("x-xsrf-token")).toBe("test=token");
    expect(fetcher.mock.calls[0][1].body).toBe("{}");
    vi.stubGlobal("document", { cookie: "" });
    await browserRequest("/api/auth/logout", { method: "POST" });
    expect(fetcher.mock.calls[1][1].headers.has("x-xsrf-token")).toBe(false);
  });
  it("rejects an external path before sending credentials", async () => {
    await expect(browserRequest("https://attacker.test/api/auth/me")).rejects.toThrow(
      "local /api/",
    );
  });
});

describe("server-only request-scoped reads", () => {
  it("reads each request's cookie and configured frontend Origin instead of browser-controlled headers", async () => {
    vi.stubEnv("FRONTEND_URL", "https://frontend.test");
    vi.stubEnv("API_UPSTREAM_URL", "http://api.test:8000");
    incoming
      .mockResolvedValueOnce(
        new Headers({ cookie: "session=first", origin: "https://attacker.test" }),
      )
      .mockResolvedValueOnce(new Headers({ cookie: "session=second" }))
      .mockResolvedValueOnce(new Headers());
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetcher);
    await Promise.all([serverRead("/api/auth/me"), serverRead("/api/auth/me")]);
    expect(fetcher.mock.calls.map(([, init]) => init.headers.cookie)).toEqual([
      "session=first",
      "session=second",
    ]);
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      headers: { origin: "https://frontend.test", accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
    });
    await serverRead("/api/auth/capabilities");
    expect(fetcher.mock.calls[2][1].headers.cookie).toBe("");
  });
  it("keeps outage distinct and does not expose its upstream exception", async () => {
    vi.stubEnv("FRONTEND_URL", "https://frontend.test");
    vi.stubEnv("API_UPSTREAM_URL", "http://api.test:8000");
    incoming.mockResolvedValue(new Headers());
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private")));
    const response = await serverRead("/api/auth/me");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "backend_unavailable" });
    await expect(serverRead("/horizon")).rejects.toThrow("local /api/");
  });
  it.each([
    "",
    "invalid",
    "https://user:password@api.test",
    "file:///api",
    "https://api.test/path",
    "https://api.test?host=outside",
    "https://api.test#fragment",
  ])("refuses invalid fixed upstream configuration %s", (value) => {
    vi.stubEnv("FRONTEND_URL", "https://frontend.test");
    vi.stubEnv("API_UPSTREAM_URL", value);
    expect(transportConfiguration).toThrow();
  });
});
