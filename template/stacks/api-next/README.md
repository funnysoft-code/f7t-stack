# `__F7T_APP_NAME__`

## Initialize locally

Use Bun >=1.4, Composer 2, PHP 8.5 and Herd Pro. From `services/api`, compare `php -v` with `herd php -v`; use `herd isolate 8.5` if the site differs. Enable ctype, curl, DOM, fileinfo, filter, hash, intl, mbstring, OpenSSL, pcntl, PDO PostgreSQL, phpredis, session, tokenizer and XML. The locked Composer platform check runs for both PHP runtimes.

Start PostgreSQL, Redis or Valkey and Herd Mail. Run `herd services:list` to inspect actual ports. Defaults are PostgreSQL 5432, Redis 6138 and SMTP 2525. For an existing Valkey on 6379, set `REDIS_PORT=6379` in `services/api/.env` after the first setup attempt, then rerun:

```sh
bun run setup
```

Setup copies safe examples only when their `.env` is absent, installs frozen Bun dependencies at the workspace root and locked Composer dependencies in `services/api`, verifies services, generates an absent app key, creates a dedicated project database, migrates and runs `bun run api:generate`. The API schema must be generated from Laravel with licensed Scramble Pro installed. Composer consumes preconfigured global credentials or inherited `COMPOSER_AUTH`. An authorization or network failure leaves setup incomplete; there is no fallback dependency or schema-only success. Never store Composer credentials in this project.

The generated database uses `f7t_<directory-slug>_<path-hash>` and Redis uses that project's prefix, queue and Horizon namespace. Setup never drops tables, flushes Redis, replaces local files, rotates an existing key or creates users. Keep the directory location stable; reconnect existing data manually when moving a project. Rerun `bun run setup` after fixing a named failed stage. Its ignored `.f7t/setup-state.json` contains nonsecret results, not credentials, and never replaces real checks on a subsequent run. Skipped setup stays pending. `initialized` means ready to start, not browser-verified.

### Processes and mailbox

Run `bun run dev` for Next. Serve `services/api` with Herd or `php artisan serve --host=127.0.0.1 --port=8000`, keeping the configured upstream and frontend origins aligned. From `services/api`, run `php artisan horizon` separately, plus `php artisan schedule:work` when developing scheduled work. Nightwatch is unregistered locally and needs no local agent.

From `services/api`, run `php artisan funnysoft:create-first-user`. The password is prompted securely. This independent command creates one ordinary, unverified account and sends verification with registration disabled. It refuses a second bootstrap account. If mail fails after creation, sign in and resend from `/verify-email` rather than creating another account.

Open **Herd → Mail**, then select `__F7T_APP_NAME__`, the mailbox selected by `MAIL_USERNAME=__F7T_APP_NAME__`. Search for your recipient and open **Verify your email address**. Sign in and follow the verification link through the frontend. For recovery, submit `/forgot-password`, then open **Reset your password** in that same mailbox. Notifications are synchronous and do not need Horizon or a Resend key. If mail is missing, check Herd Pro Mail, `MAIL_MAILER=smtp`, host 127.0.0.1 and port 2525. Herd's Mail viewer is the retrieval interface; captured data is stored at `~/Library/Application Support/Herd/HerdCoreData.sqlite`.

### Activate external services

- **Resend:** SDK and transport are installed. Verify a sender domain and set `RESEND_API_KEY`, `MAIL_MAILER=resend` and a verified sender address in the Laravel production environment.
- **Nightwatch:** disabled means the package provider is not registered. Production activation requires both `NIGHTWATCH_ENABLED=true` and `NIGHTWATCH_TOKEN`. Supervise `php artisan nightwatch:agent` separately after activation.
- **PostHog:** set `NEXT_PUBLIC_POSTHOG_ENABLED=true`, `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, then rebuild Next. The root client bootstrap initializes the SDK and captures `app_loaded` without form values. Use `analytics.capture('product_event')` for additional deliberate events. Without explicit enablement and configuration it never initializes the SDK or sends provider traffic. Automatic event collection, person profiles and session recording are off. URL, path and referrer properties are excluded because account links contain secrets.
- **Turnstile:** set Laravel's `TURNSTILE_ENABLED=true` and Next's `NEXT_PUBLIC_TURNSTILE_ENABLED=true`, then rebuild Next and clear/rebuild Laravel configuration caches. Registration and reset-link forms automatically load the widget and send `turnstile_token`; Laravel rejects missing, invalid, expired or failed-verification tokens on `POST /api/auth/register` and `POST /api/auth/forgot-password`. Each submission consumes its token and remounts after success or failure, including CSRF or backend outages. Mutations are never automatically retried. Login, password replacement and authenticated account operations do not require CAPTCHA. Registration still requires `FUNNYSOFT_REGISTRATION_ENABLED=true`. Disabled Turnstile loads no widget and makes no Siteverify calls. Local development uses the example's official dummy pair and live Siteverify, requiring internet access; CI fakes success, rejection and network failures at the route boundary. Production requires real matching `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Missing/dummy credentials fail production backend boot or frontend mount. Never log tokens or secrets.

Provision Laravel Cloud compute, PostgreSQL and Valkey in Frankfurt and connect Vercel manually. Set a stable HTTPS frontend origin and fixed server-only API upstream. Run quality before serialized deployment; apply migrations, rebuild Laravel caches and restart Horizon. Supervise the scheduler and, when enabled, Nightwatch. Validate cookies, CSRF, verification/reset links and passkeys on an authorized stable Vercel preview before calling the deployment verified.

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
