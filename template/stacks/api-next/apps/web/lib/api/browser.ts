"use client";

import { isApiPath } from "./paths";
import { createApiClient } from "@f7t/api-client";

/** Keep credentials and session rotations browser-visible. Never retry mutations automatically. */
export async function browserRequest(path: string, init: RequestInit = {}): Promise<Response> {
  if (!isApiPath(path)) throw new Error("Browser API requests require a local /api/ path");
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const cookie = document.cookie.split("; ").find((part) => part.startsWith("XSRF-TOKEN="));
    if (cookie) headers.set("x-xsrf-token", decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)));
  }
  return fetch(path, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
}

export function initializeCsrf(): Promise<Response> {
  return browserRequest("/api/auth/csrf-cookie");
}

export const browserApi = createApiClient(browserRequest);
