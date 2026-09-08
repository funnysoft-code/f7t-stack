import { describe, expect, it, vi, afterEach } from "vitest";
import { AccountError, request, confirmed, failure, localDestination } from "./flows";

afterEach(() => vi.unstubAllGlobals());

describe("account transport", () => {
  it("sends JSON and the session CSRF cookie without Inertia headers", async () => {
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=encoded%20token" });
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    expect(
      await request({ url: "/settings/profile", method: "patch" }, { name: "Alex" }),
    ).toBeNull();
    expect(fetcher).toHaveBeenCalledWith(
      "/settings/profile",
      expect.objectContaining({
        method: "PATCH",
        credentials: "same-origin",
        body: '{"name":"Alex"}',
        headers: expect.objectContaining({
          Accept: "application/json",
          "X-XSRF-TOKEN": "encoded token",
        }),
      }),
    );
    expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty("X-Inertia");
  });
  it("retries an interrupted sensitive action exactly once", async () => {
    const action = vi.fn().mockRejectedValueOnce(new AccountError(423)).mockResolvedValue("saved");
    const confirm = vi.fn().mockResolvedValue(undefined);
    expect(await confirmed(action, confirm)).toBe("saved");
    expect(action).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledOnce();
  });
  it("does not loop on expiry or retry cancellations and unrelated failures", async () => {
    const expired = vi.fn().mockRejectedValue(new AccountError(423));
    await expect(confirmed(expired, async () => {})).rejects.toMatchObject({ status: 423 });
    expect(expired).toHaveBeenCalledTimes(2);
    const cancel = vi.fn().mockRejectedValue(new AccountError(423));
    await expect(
      confirmed(cancel, async () => {
        throw new Error("cancelled");
      }),
    ).rejects.toThrow("cancelled");
    expect(cancel).toHaveBeenCalledOnce();
    await expect(
      confirmed(
        async () => {
          throw new AccountError(422);
        },
        async () => {},
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      await confirmed(
        async () => "saved",
        async () => {},
      ),
    ).toBe("saved");
  });
  it("parses validation and network failures without exposing payloads", async () => {
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Invalid fields",
            errors: { email: ["Enter another email."] },
          }),
          { status: 422 },
        ),
      ),
    );
    await expect(request({ url: "/register", method: "post" })).rejects.toMatchObject({
      status: 422,
      fields: { email: ["Enter another email."] },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    await expect(request({ url: "/login", method: "post" })).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed fetch")));
    await expect(request({ url: "/login", method: "post" })).rejects.toMatchObject({ status: 0 });
  });
  it("returns JSON and reports bounded recovery messages", async () => {
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"confirmed":true}')));
    expect(await request({ url: "/status", method: "get" })).toEqual({ confirmed: true });
    for (const status of [0, 401, 403, 419, 423, 429, 500])
      expect(failure(new AccountError(status)).message.length).toBeGreaterThan(10);
    expect(failure(new Error("private data")).message).not.toContain("private data");
    expect(
      failure(new AccountError(422, "Check the fields", { email: ["Invalid"] })).fields.email,
    ).toEqual(["Invalid"]);
  });
  it("only accepts local continuation paths", () => {
    expect(localDestination("/horizon/jobs?status=failed")).toBe("/horizon/jobs?status=failed");
    for (const path of [
      undefined,
      "https://evil.test",
      "//evil.test",
      "/\\evil",
      "/%2f%2fevil",
      "/%5cevil",
      "/%zz",
      "/\nother",
    ])
      expect(localDestination(path)).toBe("/");
  });
});
