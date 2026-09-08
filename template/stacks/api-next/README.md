# **F7T_APP_NAME**

This repository contains Next in `apps/web`, Laravel in `services/api`, generated contracts in `packages/api-client`, and shared design assets in `packages/design-system`.

## Session transport

Laravel owns accounts, permissions and registration policy. Read `services/api/AUTH.md` for the endpoint contract. Browser requests use the frontend origin for both `/api/*` and `/horizon`. The Next Route Handlers forward those paths to one configured Laravel origin.

Configure these server-side variables in the Next environment:

```dotenv
FRONTEND_URL=http://127.0.0.1:4316
API_UPSTREAM_URL=http://127.0.0.1:8316
```

Both values must be HTTP or HTTPS origins with no path, query, credentials or fragment. Keep `API_UPSTREAM_URL` server-only. Set Laravel's `APP_URL` to the backend origin and `FRONTEND_URL` to the same exact frontend origin, including its port.

For local HTTP, set Laravel's `SESSION_SECURE_COOKIE=false`. Use `true` with HTTPS. Leave `SESSION_DOMAIN` unset. Laravel issues a host-only, root-path, HttpOnly, SameSite=Lax session cookie and a readable XSRF cookie. The proxy preserves every Set-Cookie header separately, including remember-me cookies and session rotations.

Browser code calls `initializeCsrf()` from `apps/web/lib/api/browser.ts` before its first mutation. This uses the committed `/api/auth/csrf-cookie` endpoint. Then call `browserRequest()` with a local `/api/` path. The adapter URL-decodes the current XSRF cookie into `X-XSRF-TOKEN`, sends same-origin credentials and disables caching. It returns the Response, including validation, verification, confirmation, throttle and service-error statuses. Mutations are never retried automatically.

The proxy requires the exact configured Origin on mutations. If Referer is present, it must have that origin too. It preserves both headers on the upstream hop. Laravel performs the CSRF check. Read-only browser navigations can omit Origin. Client-supplied hosts, authorization and forwarding headers cannot select the upstream.

Server Components use `serverRead()` from `apps/web/lib/api/server.ts` for read-only endpoints such as `/api/auth/me`, `/api/auth/capabilities` and `/api/app`. It reads the current request's cookie, sends the configured frontend Origin and disables fetch caching. It has no shared identity cache. Session-writing calls, including CSRF initialization, login, logout and verification submissions, belong in the browser adapter so rotated cookies reach the browser. Account screens must also remain dynamically rendered.

Transport errors use private, no-store JSON. `503 backend_unavailable` means Laravel could not be reached. `502 invalid_upstream_redirect` means an upstream redirect escaped the allowed local routes. These are different from Laravel's `401`, `403`, `419`, `422`, `423` and `429` account responses.

## Native Horizon

Open `/horizon` on the frontend origin. Laravel applies its session middleware, email verification and the `viewHorizon` ability on every request, including local development. The ability checks the actual Spatie permission `view-horizon`.

From `services/api`, grant or revoke the permission with:

```sh
php artisan funnysoft:horizon-permission grant operator@example.test
php artisan funnysoft:horizon-permission revoke operator@example.test
```

Permission changes apply on the next dashboard request, poll or mutation. A grant does not verify an account or grant a general administrator role.

Guest and expired-session HTML navigation redirects to `/login?next=<local-dashboard-path>`. Unverified navigation redirects to `/verify-email?next=<local-dashboard-path>`. Verified users without permission receive 403. Internal `/horizon/api/*` requests always keep their 401/403 JSON contract. After expiry, reload and sign in again to resume the dashboard. Login, verification and 2FA screens must preserve `next` only after validating it with `dashboardContinuation()` from `apps/web/lib/api/paths.ts`.

The selected Horizon 5.48.3 dashboard embeds its CSS and JavaScript in the HTML. Its internal requests stay under `/horizon/api`. No `/vendor/*` proxy is needed. The vendor layout loads its Figtree font from `fonts.bunny.net`. Keep the dashboard mount unchanged on both hops. Re-run the native browser transport test when upgrading Horizon so new asset or network paths cannot silently bypass this boundary.

## Transport verification

Install the locked Bun and Composer dependencies, provide PostgreSQL and Redis, and install the project's Playwright Chromium browser. Choose a dedicated test database before running:

```sh
F7T_TRANSPORT_DATABASE=f7t_transport_test bun run test
```

`tests/integration/servers.ts` builds and starts real production Next servers on `127.0.0.1:4316` and `:4317`, and PHP/Laravel servers on `:8316` and `:8317`. Keep those ports free. It migrates the selected database without dropping existing tables, creates accounts with unique fixture prefixes, and namespaces Redis keys in databases 13, 14 and 15. Cleanup stops the owned processes and removes its accounts, Redis keys and temporary files. It never flushes a Redis database. Do not run schema-resetting PHP tests concurrently against this database.

The transport suites test multiple cookies, remember-me and CSRF/session rotation, concurrent server-rendered identities, Origin/Referer forwarding, unsafe paths and continuations, verification, permission changes, logout, expiry and upstream outages. The native Horizon suite also launches Chromium and checks rendered assets, same-origin dashboard requests and deep-link reloads. `F7T_CHROMIUM_EXECUTABLE` can select an already installed Chrome binary. Tests report only statuses and nonsecret metadata.

The fixture-only identity page and diagnostic routes live in temporary copies. They are not part of the generated application. Full account-screen and passkey journeys are separate browser checks.
