import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "@f7t/api-client";
import {
  authDestination,
  localDestination,
  verificationContinuation,
} from "../../apps/web/lib/api/auth";
import { startServers, type TransportServers } from "./servers";

describe("real account transport and SSR gates", () => {
  let servers: TransportServers;
  beforeAll(async () => {
    servers = await startServers(4319);
  }, 120_000);
  afterAll(async () => {
    await servers?.close();
  }, 30_000);

  it("denies guest and unverified SSR content while preserving browser-visible confirmation", async () => {
    const session = servers.session();
    expect(await (await session.request("/transport-gate")).text()).toContain("guest");
    expect((await session.request("/api/app")).status).toBe(401);
    await servers.login(session, "unverified");
    const html = await (await session.request("/transport-gate")).text();
    expect(html).toContain("unverified");
    expect(html).not.toContain("PROTECTED_CONTENT");
    expect((await session.request("/api/app")).status).toBe(403);
    expect((await session.request("/api/auth/email/verify")).status).toBe(200);
    expect((await session.mutate("/api/auth/logout")).status).toBe(204);
    await servers.login(session);
    expect(await (await session.request("/transport-gate")).text()).toContain("PROTECTED_CONTENT");
    expect((await session.request("/api/auth/user/passkeys/options")).status).toBe(423);
    expect(
      (await session.mutate("/api/auth/confirm-password", { password: "incorrect" })).status,
    ).toBe(422);
    const confirmed = await servers.confirm(session);
    expect(confirmed.status).toBe(201);
    expect(confirmed.headers.getSetCookie().length).toBeGreaterThan(0);
    expect((await session.request("/api/auth/user/passkeys/options")).status).toBe(200);
    expect(await (await session.request("/api/auth/user/passkeys")).json()).toEqual({ data: [] });
    const client = createApiClient((path, init) => {
      const headers = new Headers(init.headers);
      headers.set("origin", servers.frontend);
      headers.set("x-xsrf-token", session.csrf());
      return session.request(path, { ...init, headers });
    });
    const profile = await client.PATCH("/auth/settings/profile", {
      body: { name: "Transport account" },
    });
    expect(profile.response.status).toBe(200);
    expect(profile.data?.data.name).toBe("Transport account");
    expect(profile.data?.data).not.toHaveProperty("id");
    expect((await client.GET("/auth/me")).data?.data.uuid).toBe(profile.data?.data.uuid);
  });

  it("preserves an actual signed verification continuation through password and recovery-factor login", async () => {
    const path = servers.verificationPath("unverified");
    expect(verificationContinuation(path)).toBe(path);
    const notice = `/verify-email?verification_url=${encodeURIComponent(path)}`;
    const passwordNext = new URL(
      authDestination("/login", notice),
      servers.frontend,
    ).searchParams.get("next");
    const factorNext = new URL(
      authDestination("/two-factor-challenge", passwordNext),
      servers.frontend,
    ).searchParams.get("next");
    expect(localDestination(factorNext)).toBe(notice);
    const session = servers.session();
    const code = servers.recoveryFactor("unverified");
    const login = await servers.login(session, "unverified");
    expect(await login.json()).toEqual({ two_factor: true });
    expect((await session.request("/api/auth/me")).status).toBe(401);
    expect(
      (await session.mutate("/api/auth/two-factor-challenge", { recovery_code: code })).status,
    ).toBe(204);
    const signed = new URL(factorNext!, servers.frontend).searchParams.get("verification_url")!;
    expect(signed).toBe(path);
    expect((await session.request(signed)).status).toBe(200);
    expect((await session.request("/api/app")).status).toBe(200);
  });

  it("renders an unavailable state instead of signed out when Laravel stops", async () => {
    const session = servers.session();
    await servers.login(session);
    await servers.outage();
    const response = await session.request("/transport-gate");
    expect(await response.text()).toContain("unavailable");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
