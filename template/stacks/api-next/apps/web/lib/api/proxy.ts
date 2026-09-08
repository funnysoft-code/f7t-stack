import "server-only";

import { dashboardContinuation, isApiPath, isHorizonPath, localPath } from "./paths";

const requestHeaders = [
  "accept",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "x-xsrf-token",
  "x-csrf-token",
  "x-requested-with",
];
const responseHeaders = [
  "content-type",
  "content-language",
  "retry-after",
  "www-authenticate",
  "allow",
];
const reads = new Set(["GET", "HEAD", "OPTIONS"]);

function configuredOrigin(name: "FRONTEND_URL" | "API_UPSTREAM_URL"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an HTTP origin`);
  }
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(`${name} must be an HTTP origin`);
  return url.origin;
}

export function transportConfiguration() {
  return {
    frontend: configuredOrigin("FRONTEND_URL"),
    upstream: configuredOrigin("API_UPSTREAM_URL"),
  };
}

function privateHeaders(upstream?: Headers): Headers {
  const headers = new Headers({
    "cache-control": "private, no-store",
    vary: "Cookie, Origin, Accept",
  });
  if (upstream) {
    for (const name of responseHeaders) {
      const value = upstream.get(name);
      if (value !== null) headers.set(name, value);
    }
    for (const cookie of upstream.getSetCookie()) headers.append("set-cookie", cookie);
  }
  return headers;
}

function failure(status: number, code: string, headers = privateHeaders()): Response {
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify({ error: code }), { status, headers });
}

function redirectLocation(location: string, frontend: string, upstream: string): string | null {
  // Absolute redirects are accepted only from the configured origins. Never follow them server-side.
  let local = location;
  if (/^https?:\/\//.test(location)) {
    let url: URL;
    try {
      url = new URL(location);
    } catch {
      return null;
    }
    if (url.username || url.password || ![upstream, frontend].includes(url.origin)) return null;
    // Extract the raw path rather than accepting URL's dot-segment normalization.
    local = location.slice(location.indexOf("/", location.indexOf("://") + 3));
  }
  if (!localPath(local)) return null;
  const url = new URL(local, frontend);
  if (isApiPath(local) || isHorizonPath(local)) return url.href;
  if (!["/login", "/verify-email"].includes(url.pathname)) return null;
  const continuations = url.searchParams.getAll("next");
  if (continuations.length !== 1 || !dashboardContinuation(continuations[0])) return null;
  return url.href;
}

function validMutationOrigin(headers: Headers, frontend: string): boolean {
  if (headers.get("origin") !== frontend) return false;
  const referer = headers.get("referer");
  if (referer === null) return true;
  try {
    return new URL(referer).origin === frontend;
  } catch {
    return false;
  }
}

/** Fixed-upstream, uncached transport for browser-visible session writes and native Horizon. */
export async function proxyRequest(request: Request): Promise<Response> {
  const { frontend, upstream } = transportConfiguration();
  const url = new URL(request.url);
  const path = url.pathname + url.search;
  if (!isApiPath(path) && !isHorizonPath(path)) return failure(400, "invalid_proxy_path");
  if (!reads.has(request.method) && !validMutationOrigin(request.headers, frontend))
    return failure(403, "invalid_origin");
  const headers = new Headers();
  for (const name of requestHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  try {
    const response = await fetch(new URL(path, upstream), {
      method: request.method,
      headers,
      body: reads.has(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const outgoing = privateHeaders(response.headers);
    const location = response.headers.get("location");
    if (location !== null) {
      const safe = redirectLocation(location, frontend, upstream);
      if (!safe) {
        await response.body?.cancel();
        return failure(502, "invalid_upstream_redirect", outgoing);
      }
      outgoing.set("location", safe);
    }
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch {
    return failure(503, "backend_unavailable");
  }
}
