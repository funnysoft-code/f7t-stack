import { describe, expect, it } from "vitest";
import { AccountError, confirmed, failure, request } from "./flows";

describe("account operation boundaries", () => {
  it("unwraps generated responses and preserves error status and fields", async () => {
    expect(
      await request(
        Promise.resolve({ response: new Response(), data: { data: { uuid: "public" } } }),
      ),
    ).toEqual({ data: { uuid: "public" } });
    expect(
      await request(Promise.resolve({ response: new Response(null, { status: 204 }) })),
    ).toBeUndefined();
    await expect(
      request(
        Promise.resolve({
          response: new Response(null, { status: 422 }),
          error: { message: "Invalid email", errors: { email: ["Invalid"] } },
        }),
      ),
    ).rejects.toMatchObject({ status: 422, fields: { email: ["Invalid"] } });
    await expect(
      request(Promise.resolve({ response: new Response(null, { status: 503 }) })),
    ).rejects.toMatchObject({ status: 503 });
    await expect(request(Promise.reject(new Error("offline")))).rejects.toMatchObject({
      status: 0,
    });
  });
  it("confirms and retries only once, propagating cancellations and second expiry", async () => {
    expect(
      await confirmed(
        async () => "done",
        async () => {},
      ),
    ).toBe("done");
    let attempts = 0;
    expect(
      await confirmed(
        async () => {
          if (!attempts++) throw new AccountError(423);
          return "done";
        },
        async () => {},
      ),
    ).toBe("done");
    expect(attempts).toBe(2);
    attempts = 0;
    await expect(
      confirmed(
        async () => {
          attempts++;
          throw new AccountError(423);
        },
        async () => {},
      ),
    ).rejects.toMatchObject({ status: 423 });
    expect(attempts).toBe(2);
    await expect(
      confirmed(
        async () => {
          throw new AccountError(423);
        },
        async () => {
          throw new Error("cancelled");
        },
      ),
    ).rejects.toThrow("cancelled");
    await expect(
      confirmed(
        async () => {
          throw new AccountError(503);
        },
        async () => {},
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
  it("keeps actionable failures distinct without rendering upstream outages as logout", () => {
    for (const status of [0, 401, 403, 404, 419, 423, 429, 502, 503, 500])
      expect(failure(new AccountError(status)).message).toBeTruthy();
    expect(failure(new AccountError(422, "Check email", { email: ["Invalid"] }))).toEqual({
      message: "Check email",
      fields: { email: ["Invalid"] },
    });
    expect(failure(new AccountError(422)).message).toBeTruthy();
    expect(failure(new Error()).message).toContain("password");
    expect(failure(Object.assign(new Error(), { name: "NotSupportedError" })).message).toContain(
      "does not support",
    );
    expect(failure(Object.assign(new Error(), { name: "UserCancelledError" })).message).toContain(
      "cancelled",
    );
  });
});
