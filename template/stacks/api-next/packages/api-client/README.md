# Account client integration

Laravel generates `openapi.json`, then `openapi-typescript` generates `src/schema.d.ts`. Import `paths`, `operations`, `User`, and `Passkey` from `@f7t/api-client`. The client uses `openapi-fetch` through a supplied transport, with no cookie store or shared identity cache.

## U11 browser contract

Use `browserApi` from `apps/web/lib/api/browser.ts`. Paths match the schema and omit `/api`, for example `browserApi.POST("/auth/login", { body: { email, password } })`. The adapter adds `/api`, credentials, current decoded XSRF, and `no-store`. Prime CSRF with `initializeCsrf()` before login and other guest mutations. Do not automatically retry mutations.

Inspect `result.response.status` before reading `data`. Keep 401, 403, 419, 422, 423, 429, and 502/503 distinct. A 423 requires password or passkey confirmation, followed by one explicit retry of the intended action. A transport outage is an error state, never a signed-out state.

Use `serverAccount()` for request-scoped SSR gates. Only `kind: "verified"` permits protected content. `unverified` opens verification, `guest` opens login, and `unavailable` renders dependency failure. Laravel independently guards `/api/app`. Server reads reject account GETs that prime CSRF, create passkey challenges, or consume signed verification links; these must remain browser-visible.

Keep the validated `next` value through password and factor screens with `authDestination()`. On completion use `localDestination()`, never a raw `next` parameter or the passkey package's `redirect`. A verification notice carries `verification_url`; validate it with `verificationContinuation()` and submit that exact string with `browserRequest()`. Do not reconstruct its signed query.

## Passkeys 0.4.0

`registerPasskey(name)` uses the supported `Passkeys.register` ceremony and discards its stock `id`-based return type. It then refetches the generated listing through `browserApi.GET("/auth/user/passkeys")`. Read `result.data.data`, with `uuid`, `name`, `created_at`, and `last_used_at`. Removal accepts that UUID through `params.path.passkey`. No integer ID alias exists.

For login use `Passkeys.verify({ routes: passkeyRoutes.login })`. For recent confirmation use `Passkeys.verify({ routes: passkeyRoutes.confirmation })`. Both route pairs stay on `/api/auth`. Let the package handle browser cancellation and unsupported authenticators, and retain password fallback. The package's HTTP exceptions do not expose structured response status; do not reinterpret a generic ceremony error as logout or authorization. Typed account requests retain the real HTTP status.

Never retain credentials, QR/manual secrets, TOTP values, or recovery codes in storage, logs, analytics, or caches. Production HTTPS and stable-host WebAuthn ceremonies still require browser verification in U10-U14.

## Generation and verification

From an installed, stamped application with an isolated PostgreSQL database:

```sh
FUNNYSOFT_REGISTRATION_ENABLED=true bash scripts/generate-api-client.sh --write
FUNNYSOFT_REGISTRATION_ENABLED=true bash scripts/generate-api-client.sh --check
F7T_TRANSPORT_DATABASE=your_test_database bun run test
```

The generation process must include the optional registration route and bypass pre-existing Laravel route/config caches. The coordinator owns the standards script correction for that export environment. Keep TypeScript 5.9.3 as the compiler API dependency of `openapi-typescript` 7.13.0; TypeScript 7.0.2 lacks the API it imports.

`tests/contracts/auth-contract.test.ts` runs the standards script against an isolated backend copy, checks the clean artifacts, adds a backend response field, and proves the check fails while both saved artifacts stay byte-for-byte unchanged. Tests use installed Composer packages without retrieving license credentials.
