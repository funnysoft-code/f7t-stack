import { describe, expect, it } from "vitest";

describe("workspace foundation", () => {
  it("serves a nonvisual Next health response", async () => {
    const { GET } = await import("../../apps/web/app/health/route");
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("resolves the workspace exports", async () => {
    expect(await import("@f7t/api-client")).toBeDefined();
    expect(await import("@f7t/design-system")).toBeDefined();
  });
});
