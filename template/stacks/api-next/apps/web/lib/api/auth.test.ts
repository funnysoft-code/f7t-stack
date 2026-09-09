import { describe, expect, it } from "vitest";
import { accountState, authDestination, localDestination, verificationContinuation } from "./auth";

describe("account routing contract", () => {
  it.each([
    [401, "guest"],
    [403, "denied"],
    [422, "validation"],
    [423, "confirmation"],
    [429, "throttled"],
    [502, "unavailable"],
    [503, "unavailable"],
    [419, "csrf"],
    [500, "error"],
  ])("classifies %s without treating service failure as logout", async (status, state) => {
    expect(
      await accountState(Response.json({ message: "failed" }, { status: Number(status) })),
    ).toEqual({ kind: state });
  });
  it.each([true, false])("retains verified state %s", async (verified) => {
    const user = {
      uuid: "01991c6a-5770-7000-8000-000000000001",
      name: "One",
      email: "one@example.test",
      email_verified: verified,
      two_factor_enabled: false,
      two_factor_confirmed: false,
    };
    expect(await accountState(Response.json({ data: user }))).toEqual({
      kind: verified ? "verified" : "unverified",
      user,
    });
  });
  it("rejects malformed successful identity responses", async () => {
    expect(await accountState(Response.json({ data: { id: 1 } }))).toEqual({ kind: "error" });
    expect(await accountState(new Response("broken"))).toEqual({ kind: "error" });
  });
  it("preserves the exact signed query through password and factor navigation", () => {
    const path =
      "/api/auth/email/verify/01991c6a-5770-7000-8000-000000000001/" +
      "a".repeat(40) +
      "?expires=123&signature=" +
      "b".repeat(64);
    expect(verificationContinuation(path)).toBe(path);
    const notice = `/verify-email?verification_url=${encodeURIComponent(path)}`;
    expect(authDestination("/login", notice)).toBe(`/login?next=${encodeURIComponent(notice)}`);
    expect(authDestination("/two-factor-challenge", notice)).toBe(
      `/two-factor-challenge?next=${encodeURIComponent(notice)}`,
    );
  });
  it.each([
    "/horizon",
    "/horizon/dashboard",
    "/horizon/jobs/failed?queue=mail%2Fpriority&search=a+b&search=a%20b",
  ])("preserves native Horizon continuation bytes through login and 2FA: %s", (path) => {
    const login = authDestination("/login", path);
    expect(login).toBe(`/login?next=${encodeURIComponent(path)}`);
    const loginNext = new URL(login, "https://frontend.test").searchParams.get("next");
    const challenge = authDestination("/two-factor-challenge", loginNext);
    expect(challenge).toBe(`/two-factor-challenge?next=${encodeURIComponent(path)}`);
    expect(
      localDestination(new URL(challenge, "https://frontend.test").searchParams.get("next")),
    ).toBe(path);
  });
  it.each([
    "/horizon/api",
    "/horizon/api?limit=10",
    "/horizon/api/jobs/recent",
    "/horizon/%61pi/jobs/recent",
    "https://outside.test/horizon/dashboard",
    "//outside.test/horizon/dashboard",
    "/horizon/../login",
    "/horizon/%2e%2e/login",
    "/horizon/%252foutside",
    "/horizon/%5coutside",
    "/horizon/dashboard#outside",
  ])("rejects unsafe Horizon continuations on both auth screens: %s", (path) => {
    expect(authDestination("/login", path)).toBe("/login?next=%2Fapp");
    expect(authDestination("/two-factor-challenge", path)).toBe(
      "/two-factor-challenge?next=%2Fapp",
    );
    expect(localDestination(path)).toBe("/app");
  });
  it.each([
    null,
    "https://outside.test",
    "//outside.test",
    "/app?next=https://outside.test",
    "/api/auth/csrf-cookie",
    "/verify-email?verification_url=//outside.test",
    "/app#outside",
    "/%5coutside",
    "/app/../login",
  ])("bounds continuations %s", (path) => {
    expect(verificationContinuation(path)).toBeNull();
    expect(authDestination("/login", path)).toBe("/login?next=%2Fapp");
  });
  it("accepts only named local destinations", () => {
    for (const path of [
      "/settings/passkeys",
      "/settings/authenticator",
      "/settings/recovery",
      "/settings/delete-account",
    ])
      expect(localDestination(path)).toBe(path);
    expect(authDestination("/login", "/settings/security")).toBe(
      "/login?next=%2Fsettings%2Fsecurity",
    );
    expect(authDestination("/login", "/verify-email")).toBe("/login?next=%2Fverify-email");
  });
});
