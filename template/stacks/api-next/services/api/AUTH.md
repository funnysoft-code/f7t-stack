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
| PATCH | `/settings/profile` | Optional name/email fields; 200 user resource. Name-only updates require verification. Email changes additionally require recent confirmation. |
| PUT | `/settings/password` | Verified and recently confirmed; password/password_confirmation, minimum 12 characters; 204 |
| DELETE | `/settings/account` | Verified and recently confirmed; no raw password field; 204 and invalidated session |

The user resource is `{ "data": { "uuid": "...", "name": "...", "email": "...", "email_verified": false } }`. It never exposes database IDs, passwords, tokens, permission internals, or authenticator secrets. `/api/app` is the initial verified application boundary and returns this resource. New application routes must keep both `auth:web` and `verified`; escape routes stay outside that boundary.

Named rate limits apply to every route. Login and confirmation share five attempts per minute per email/IP key; reset submissions allow five per minute per IP; verification allows six per minute per account; the account mount has an additional sixty-per-minute IP limit.

## Settings and confirmation

Sensitive requests return JSON 423 before validation or mutation when confirmation is missing or expired. Use `/confirm-password`, then retry the intended request once. Fortify stores proof in `auth.password_confirmed_at` and uses `auth.password_timeout`. No settings mutation asks for `current_password`. U8 must use the supported passkey confirmation ceremony that writes this same timestamp. Login alone does not confirm a sensitive action, including login through a remember cookie.

An unverified user may correct a changed email after confirmation. That exception permits no name change, password change, or deletion. Escape routes for notice, resend, confirmation, and logout remain reachable. Changing email clears verification, removes the old email's reset token, sends verification to the new address, and immediately blocks app access from other sessions. Delivery failure retains the corrected unverified account, which can resend. Name/email validation completes before either field is saved.

The web middleware checks Laravel's session password fingerprint on authenticated requests, including Horizon. The login event seeds that fingerprint immediately, so even a second session idle since login is revoked after password change or reset. Password updates rotate the remember token and remove reset tokens. The changing session remains authenticated through Laravel's post-response fingerprint update. Deletion logs out before removing the account, deletes reset tokens, and removes the row holding authenticator credentials. Spatie's deletion hook removes role and permission grants. Other sessions and remember cookies can no longer resolve the account.

Fortify's `TwoFactorAuthenticationChallenged` event binds pending `login.id` to `login.credential_hash`, a server-side digest of the password hash. `ValidatePendingLogin` rejects missing, changed, or deleted credential state with 401 and clears the pending login. Tests exercise a real password challenge with the feature temporarily enabled and invalidate its proof through reset, change, and deletion. U8 still owns enabling the factor routes, rechecking this binding at factor completion, single-use challenge consumption, and real passkey login/confirmation/deletion evidence. No passkey schema exists yet; U8 must add account-deletion cascade ownership for it.

### Vendor route inventory

`Fortify::ignoreRoutes()` disables the vendor route file. The only registered account mutations are the routes listed above. Both the original and `/api/auth`-prefixed `/user/profile-information` and `/user/password` routes are absent. Route-cache tests confirm there is no alternate profile/password bypass.

The inspected Fortify 1.39 routes also define authenticator enable, confirm and disable; QR-code, manual-secret and recovery-code reads; recovery-code regeneration; passkey registration options, enrollment and removal. None is registered in U7. U8 must mount all authenticator management and secret reads behind `auth:web`, `verified` and `password.confirm`, and use the same confirmation boundary for passkey management. Passkey login and confirmation ceremonies have their own supported authentication/throttle rules. Retain `JsonAccountResponse`, session middleware and private no-store handling on every new API route, including exception responses. The cached-route inventory test must be updated with the deliberately enabled factor routes and prove each management/read route rejects missing and expired proof.

## Mail and frontend continuations

Set `FRONTEND_URL` to the exact frontend origin. Verification mail opens `/verify-email?verification_url=<encoded-relative-signed-path>`. The decoded value starts with `/api/auth/email/verify/` and contains the untouched expires/signature query. The frontend validates this local mount, preserves it through login and 2FA, then submits the exact path/query through the proxy. Do not reconstruct, append tracking parameters to, or change the signed path. Laravel checks expiry, signature, authenticated public UUID, and the account's current email hash. A link for the old email stops working after an email correction.

Reset mail opens `/reset-password?token=...&email=...` on the frontend. Retrieve local messages through the Herd SMTP viewer at the configured `MAIL_HOST`/`MAIL_PORT`, default port 2525. Production credentials are unnecessary for this local transport.

Public signup remains an unverified account if delivery fails. Its signed-in session can open the notice and resend. The notice should always provide resend and logout. Mail failures are reported server-side; they do not silently roll back an account after durable creation.

## First account and Horizon

Run `php artisan funnysoft:create-first-user --name="Your name" --email=you@example.test`. Enter and confirm the password at the protected prompts, never in command arguments. Invalid input or a mismatched confirmation creates no account and sends no mail. The command locks the PostgreSQL users table inside a transaction, rechecks emptiness, and creates one ordinary unverified account. It refuses nonempty tables and grants no role or permission. Verification delivery happens after the transaction. If delivery fails, the command exits unsuccessfully but retains the account and tells you to sign in and resend. Do not rerun provisioning as mail recovery.

Use `php artisan funnysoft:horizon-permission grant you@example.test` or `revoke` to change only the `view-horizon` Spatie permission. Laravel's `viewHorizon` gate additionally requires email verification, including locally. The native dashboard stays mounted at `/horizon`; U16 owns its bounded frontend proxy and navigation redirects. This command grants no general administrator role.

## Verification

Run the backend gates against a dedicated PostgreSQL database. HTTP tests use array cache/session stores and fake notifications. U5's Redis cache-clear isolation test is destructive to its selected Redis cache database. When another fixture shares that database, exclude only that already-proven test with `vendor/bin/pest --filter='^(?!.*keeps Redis session state)'`, and retain the ordinary full test command for isolated CI. Do not flush shared Redis storage.
