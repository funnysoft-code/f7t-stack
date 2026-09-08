import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createApiClient } from "./index";
import type { operations, Passkey } from "./index";

type Registration =
  operations["passkey.store"]["responses"][200]["content"]["application/json"]["data"];
expectTypeOf<Registration["uuid"]>().toEqualTypeOf<string>();
expectTypeOf<Registration>().not.toHaveProperty("id");
expectTypeOf<Passkey>().not.toHaveProperty("id");
expectTypeOf<
  operations["passkey.destroy"]["parameters"]["path"]["passkey"]
>().toEqualTypeOf<string>();

describe("generated account client", () => {
  it("uses the browser adapter and serializes typed JSON without capturing credentials", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ two_factor: true }));
    const api = createApiClient(transport);
    const result = await api.POST("/auth/login", {
      body: { email: "one@example.test", password: "test-password", remember: true },
    });
    expect(result.data?.two_factor).toBe(true);
    expect(transport.mock.calls[0][0]).toBe("/api/auth/login");
    expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual({
      email: "one@example.test",
      password: "test-password",
      remember: true,
    });
    expect(transport.mock.calls[0][1].cache).toBe("no-store");
  });
  it("uses public UUID path parameters and preserves validation failures", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: "invalid", errors: { credential: ["invalid"] } }, { status: 422 }),
      );
    const api = createApiClient(transport);
    const uuid = "01991c6a-5770-7000-8000-000000000001";
    const result = await api.DELETE("/auth/user/passkeys/{passkey}", {
      params: { path: { passkey: uuid } },
    });
    expect(transport.mock.calls[0][0]).toBe(`/api/auth/user/passkeys/${uuid}`);
    expect(transport.mock.calls[0][1].body).toBeUndefined();
    expect(result.response.status).toBe(422);
    expect(result.error).toHaveProperty("errors.credential");
  });
});
