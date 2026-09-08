// Deterministic HTTP fixtures for browser CI. Live Laravel proof is recorded separately.
import { createServer } from "node:http";

const user = {
  uuid: "01991c6a-5770-7000-8000-000000000001",
  name: "Browser account",
  email: "browser@example.test",
  email_verified: true,
  two_factor_enabled: false,
  two_factor_confirmed: false,
};
createServer(async (req, res) => {
  const cookies = Object.fromEntries(
    (req.headers.cookie ?? "")
      .split("; ")
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      }),
  );
  const path = new URL(req.url, "http://fixture.test").pathname;
  const method = req.method;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  const set = [];
  const cookie = (name, value) =>
    set.push(`${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`);
  const reply = (status, data) => {
    res.writeHead(status, {
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "set-cookie": set,
    });
    res.end(data === undefined ? undefined : JSON.stringify(data));
  };
  const state = cookies.account;
  const identity = {
    ...user,
    email: cookies.email ?? user.email,
    email_verified: state === "verified",
    two_factor_enabled: cookies.factor === "pending" || cookies.factor === "confirmed",
    two_factor_confirmed: cookies.factor === "confirmed",
  };
  if (path === "/up") return reply(200, {});
  if (path === "/api/auth/capabilities")
    return reply(cookies.outage || cookies.capabilityOutage ? 503 : 200, {
      data: { registration: cookies.registration === "enabled" },
    });
  if (path === "/api/auth/csrf-cookie") {
    cookie("XSRF-TOKEN", "fixture-xsrf");
    return reply(204);
  }
  if (path === "/api/auth/me" || path === "/api/auth/email/verify")
    return reply(
      cookies.outage ? 503 : state ? 200 : 401,
      state ? { data: identity } : { message: "Unauthenticated" },
    );
  if (path === "/api/auth/login") {
    if (body.email.startsWith("factor")) return reply(200, { two_factor: true });
    cookie("account", "verified");
    return reply(200, { two_factor: false });
  }
  if (path === "/api/auth/register") {
    if (cookies.registration !== "enabled") return reply(404, {});
    cookie("account", "unverified");
    cookie("email", body.email);
    return reply(201, {});
  }
  if (path === "/api/auth/logout") {
    cookie("account", "");
    cookie("confirmed", "");
    return reply(204);
  }
  if (path === "/api/auth/two-factor-challenge") {
    cookie("account", "verified");
    return reply(204);
  }
  if (path === "/api/auth/forgot-password" || path === "/api/auth/reset-password")
    return reply(200, { message: "Request received" });
  if (path === "/api/auth/confirm-password") {
    cookie("confirmed", "yes");
    return reply(201);
  }
  if (path === "/api/auth/confirmed-password-status")
    return reply(200, { confirmed: cookies.confirmed === "yes" });
  if (path === "/api/auth/email/verification-notification")
    return reply(202, { status: "verification-link-sent" });
  if (path.startsWith("/api/auth/email/verify/")) {
    cookie("account", "verified");
    return reply(200, { data: { ...identity, email_verified: true } });
  }
  if (!state) return reply(401, { message: "Unauthenticated" });
  if (path === "/api/auth/user/passkeys" && method === "GET") return reply(200, { data: [] });
  if (cookies.confirmed !== "yes") return reply(423, { message: "Confirm your identity" });
  if (path === "/api/auth/settings/profile") {
    const changed = body.email !== identity.email;
    if (changed) {
      cookie("account", "unverified");
      cookie("email", body.email);
    }
    return reply(200, { data: { ...identity, ...body, email_verified: !changed } });
  }
  if (path === "/api/auth/settings/account") {
    cookie("account", "");
    return reply(204);
  }
  if (path === "/api/auth/settings/password") return reply(204);
  if (path === "/api/auth/user/two-factor-authentication") {
    cookie("factor", method === "DELETE" ? "" : "pending");
    return reply(200, {});
  }
  if (path === "/api/auth/user/confirmed-two-factor-authentication") {
    cookie("factor", "confirmed");
    return reply(200, {});
  }
  if (path === "/api/auth/user/two-factor-qr-code")
    return reply(200, {
      svg: "",
      url: "otpauth://totp/Fixture?secret=JBSWY3DPEHPK3PXP&issuer=Fixture",
    });
  if (path === "/api/auth/user/two-factor-secret-key")
    return reply(200, { secretKey: "JBSWY3DPEHPK3PXP" });
  if (path === "/api/auth/user/two-factor-recovery-codes")
    return reply(200, method === "GET" ? ["fixture-code-one", "fixture-code-two"] : {});
  return reply(404, { message: "Fixture route not implemented" });
}).listen(8052, "127.0.0.1");
