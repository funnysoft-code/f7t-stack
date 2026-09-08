import "server-only";

import { headers } from "next/headers";
import { isApiPath } from "./paths";
import { transportConfiguration } from "./proxy";

/** Request-scoped reads only. Mutations must use the browser proxy so cookies reach the browser. */
export async function serverRead(path: string): Promise<Response> {
  if (!isApiPath(path)) throw new Error("Server reads require a local /api/ path");
  const { frontend, upstream } = transportConfiguration();
  const incoming = await headers();
  try {
    return await fetch(new URL(path, upstream), {
      headers: {
        accept: "application/json",
        cookie: incoming.get("cookie") ?? "",
        origin: frontend,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json(
      { error: "backend_unavailable" },
      { status: 503, headers: { "cache-control": "private, no-store" } },
    );
  }
}
