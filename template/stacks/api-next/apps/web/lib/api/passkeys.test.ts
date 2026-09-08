import { expect, it, vi } from "vitest";

const register = vi.hoisted(() => vi.fn());
vi.mock("@laravel/passkeys", () => ({ Passkeys: { register } }));
const GET = vi.hoisted(() => vi.fn());
vi.mock("./browser", () => ({ browserApi: { GET } }));
import { registerPasskey, passkeyRoutes } from "./passkeys";

it("discards the stock id-based return type and refetches generated UUID metadata", async () => {
  register.mockResolvedValue({ data: { uuid: "public-uuid" }, status: "passkey-registered" });
  GET.mockResolvedValue({
    data: { data: [{ uuid: "public-uuid", name: "Laptop", created_at: null, last_used_at: null }] },
  });
  const result = await registerPasskey("Laptop");
  expect(register).toHaveBeenCalledWith({ name: "Laptop", routes: passkeyRoutes.registration });
  expect(GET).toHaveBeenCalledWith("/auth/user/passkeys");
  expect(result.data?.data[0].uuid).toBe("public-uuid");
  expect(result.data?.data[0]).not.toHaveProperty("id");
});

it("preserves cancellation and never lists after a failed ceremony", async () => {
  GET.mockClear();
  register.mockRejectedValue(new Error("cancelled"));
  await expect(registerPasskey("Laptop")).rejects.toThrow("cancelled");
  expect(GET).not.toHaveBeenCalled();
});
