import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type { components, operations, paths } from "./schema";
export type User = components["schemas"]["UserResource"];
export type Passkey = components["schemas"]["PasskeyResource"];
export type ApiTransport = (path: string, init: RequestInit) => Promise<Response>;

/** The synthetic base only constructs Requests. All I/O goes through the supplied session adapter. */
export function createApiClient(transport: ApiTransport) {
  return createClient<paths>({
    baseUrl: "https://api.invalid/api",
    cache: "no-store",
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      return transport(`${url.pathname}${url.search}`, {
        method: request.method,
        headers: request.headers,
        body: request.body ? await request.text() : undefined,
        signal: request.signal,
        cache: "no-store",
      });
    },
  });
}
