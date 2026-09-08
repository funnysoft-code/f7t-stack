# Identity API

Laravel owns accounts and registration policy. Set `FUNNYSOFT_REGISTRATION_ENABLED=true` to enable signup. The default is false. Apply configuration changes with `php artisan config:cache` and `php artisan route:cache`, then reload long-running processes. Cached signup routes also check `config('funnysoft.registration_enabled')` when creating a user.

## Session transport

All account routes use the session-backed `web` guard and the `web` middleware group. The canonical backend mount is `/api/auth`. The Next proxy must preserve that path. There are no bearer tokens or Sanctum routes in this implementation. A session-enabled same-origin proxy does not need Sanctum's cross-origin SPA classifier.

Before a mutation, GET `/api/auth/csrf-cookie`. Forward both upstream cookies individually. The session cookie is HttpOnly, host-only, root-path, SameSite=Lax, and Secure on HTTPS. `XSRF-TOKEN` is readable. Send its URL-decoded value as `X-XSRF-TOKEN` along with cookies on mutations. Preserve incoming browser Origin/Referer, validate the frontend origin at the bounded proxy, and never manufacture a browser origin. Do not forward client-selected hosts or URLs to Laravel. Local HTTP uses `SESSION_SECURE_COOKIE=false`; HTTPS environments must use true. Leave `SESSION_DOMAIN` unset.

Account routes always return JSON, including when Accept is absent. Success and error responses are private and no-store. The frontend must also disable shared caching. Unauthenticated requests receive 401, unverified application access receives 403, failed CSRF receives 419, invalid fields receive 422, and rate limits receive 429. Password confirmation uses Fortify's session timestamp and is available to unverified users for the narrow correction flow in account settings.

## Routes

Paths below are relative to `/api/auth`.

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/capabilities` | Public `{ "data": { "registration": false } }`, from the single Laravel setting |
| GET | `/csrf-cookie` | Public 204 with XSRF and session cookies |
| POST | `/register` | Available only when enabled; name, email, password, password_confirmation; Fortify 201 |
| POST | `/login` | email, password, optional remember; Fortify 200 `{ "two_factor": false }` in U6 |
| POST | `/forgot-password` | email; always 200 with the same message for existing, absent, throttled broker delivery, or mail failure |
| POST | `/reset-password` | email, token, password, password_confirmation; Fortify 200 message or generic 422 email error |
| GET | `/me` | Authenticated, unverified-safe user resource |
| GET | `/email/verify` | Authenticated, unverified-safe user resource for the notice |
| POST | `/email/verification-notification` | Authenticated resend; Fortify 202 status, or 204 if already verified |
| GET | `/email/verify/{uuid}/{hash}` | Authenticated relative signed URL, current email hash; 200 user resource |
| POST | `/logout` | Authenticated 204, session invalidation and CSRF rotation |
| POST | `/confirm-password` | Authenticated password; Fortify 201 on success, 422 on failure |
| GET | `/confirmed-password-status` | Authenticated Fortify `{ "confirmed": boolean }` |

The user resource is `{ "data": { "uuid": "...", "name": "...", "email": "...", "email_verified": false } }`. It never exposes database IDs, passwords, tokens, permission internals, or authenticator secrets. `/api/app` is the initial verified application boundary and returns this resource. New application routes must keep both `auth:web` and `verified`; escape routes stay outside that boundary.

Named rate limits apply to every route. Login and confirmation share five attempts per minute per email/IP key; reset submissions allow five per minute per IP; verification allows six per minute per account; the account mount has an additional sixty-per-minute IP limit.

## Mail and frontend continuations

Set `FRONTEND_URL` to the exact frontend origin. Verification mail opens `/verify-email?verification_url=<encoded-relative-signed-path>`. The decoded value starts with `/api/auth/email/verify/` and contains the untouched expires/signature query. The frontend validates this local mount, preserves it through login and 2FA, then submits the exact path/query through the proxy. Do not reconstruct, append tracking parameters to, or change the signed path. Laravel checks expiry, signature, authenticated public UUID, and the account's current email hash. A link for the old email stops working after an email correction.

Reset mail opens `/reset-password?token=...&email=...` on the frontend. Retrieve local messages through the Herd SMTP viewer at the configured `MAIL_HOST`/`MAIL_PORT`, default port 2525. Production credentials are unnecessary for this local transport.

Public signup remains an unverified account if delivery fails. Its signed-in session can open the notice and resend. The notice should always provide resend and logout. Mail failures are reported server-side; they do not silently roll back an account after durable creation.

## First account and Horizon

Run `php artisan funnysoft:create-first-user --name="Your name" --email=you@example.test`. Enter and confirm the password at the protected prompts, never in command arguments. Invalid input or a mismatched confirmation creates no account and sends no mail. The command locks the PostgreSQL users table inside a transaction, rechecks emptiness, and creates one ordinary unverified account. It refuses nonempty tables and grants no role or permission. Verification delivery happens after the transaction. If delivery fails, the command exits unsuccessfully but retains the account and tells you to sign in and resend. Do not rerun provisioning as mail recovery.

Use `php artisan funnysoft:horizon-permission grant you@example.test` or `revoke` to change only the `view-horizon` Spatie permission. Laravel's `viewHorizon` gate additionally requires email verification, including locally. The native dashboard stays mounted at `/horizon`; U16 owns its bounded frontend proxy and navigation redirects. This command grants no general administrator role.

## Verification

Run the backend gates against a dedicated PostgreSQL database. HTTP tests use array cache/session stores and fake notifications. U5's Redis cache-clear isolation test is destructive to its selected Redis cache database. When another fixture shares that database, exclude only that already-proven test with `vendor/bin/pest --filter='^(?!.*keeps Redis session state)'`, and retain the ordinary full test command for isolated CI. Do not flush shared Redis storage.
