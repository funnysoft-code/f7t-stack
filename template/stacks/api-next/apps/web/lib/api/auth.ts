import type { User } from "@f7t/api-client";
import { dashboardContinuation } from "./paths";

export type AccountState =
  | { kind: "verified" | "unverified"; user: User }
  | {
      kind:
        | "guest"
        | "denied"
        | "validation"
        | "confirmation"
        | "throttled"
        | "unavailable"
        | "csrf"
        | "error";
    };

/** Only a 401 is signed out. A failed dependency must reach the page's error state. */
export async function accountState(response: Response): Promise<AccountState> {
  if (!response.ok) {
    const states = {
      401: "guest",
      403: "denied",
      419: "csrf",
      422: "validation",
      423: "confirmation",
      429: "throttled",
      502: "unavailable",
      503: "unavailable",
    } as const;
    return { kind: states[response.status as keyof typeof states] ?? "error" };
  }
  try {
    const { data } = await response.json();
    if (
      typeof data?.uuid !== "string" ||
      typeof data.name !== "string" ||
      typeof data.email !== "string" ||
      typeof data.email_verified !== "boolean" ||
      typeof data.two_factor_enabled !== "boolean" ||
      typeof data.two_factor_confirmed !== "boolean"
    )
      return { kind: "error" };
    return { kind: data.email_verified ? "verified" : "unverified", user: data };
  } catch {
    return { kind: "error" };
  }
}

/** Never reconstruct a signed URL. Validate its shape and return the original bytes. */
export function verificationContinuation(value: string | null): string | null {
  if (
    !value ||
    !/^\/api\/auth\/email\/verify\/[0-9a-f-]{36}\/[0-9a-f]{40}\?expires=\d+&signature=[0-9a-f]{64}$/.test(
      value,
    )
  )
    return null;
  return value;
}

export function localDestination(value: string | null): string {
  const dashboard = value && dashboardContinuation(value);
  // Check the decoded mount too, so encoded names cannot reach Horizon's internal API.
  if (dashboard && dashboardContinuation(decodeURIComponent(dashboard.split("?")[0])))
    return dashboard;
  if (
    value &&
    [
      "/app",
      "/settings/profile",
      "/settings/security",
      "/settings/passkeys",
      "/settings/authenticator",
      "/settings/recovery",
      "/settings/delete-account",
      "/verify-email",
    ].includes(value)
  )
    return value;
  if (value?.startsWith("/verify-email?verification_url=")) {
    const query = new URLSearchParams(value.slice(value.indexOf("?") + 1));
    if ([...query.keys()].length === 1 && verificationContinuation(query.get("verification_url")))
      return value;
  }
  return "/app";
}

export function authDestination(
  page: "/login" | "/two-factor-challenge",
  next: string | null,
): string {
  return `${page}?next=${encodeURIComponent(localDestination(next))}`;
}
