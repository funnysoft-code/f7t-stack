# Account security contract

## Settings and recent confirmation

The native Fortify confirmation endpoints remain authoritative:

- `POST /user/confirm-password`, body `{ "password": "..." }`, returns 201 on success and 422 on a wrong password.
- `GET /user/confirmed-password-status` returns `{ "confirmed": true|false }`.
- The server session key is `auth.password_confirmed_at`, written by Laravel's `session()->passwordConfirmed()`. The lifetime is `auth.password_timeout`.
- Sensitive JSON requests return 423 when confirmation is missing or expired. HTML requests redirect to the native confirmation page. U10 should preserve the intended local action, perform confirmation, then retry that action once.
- Passkey confirmation uses the package controller, which verifies the credential before calling `passwordConfirmed()`. Passkey login does not set this timestamp, including for accounts with confirmed authenticator enrollment.

| Method and path | Input | Boundary | Success |
| --- | --- | --- | --- |
| PATCH `/settings/profile` | `name`, `email` | Authenticated; unchanged email requires verified account; changed email requires recent confirmation | 204 |
| PUT `/settings/password` | `password`, `password_confirmation` | Authenticated, verified, recently confirmed | 204 |
| DELETE `/settings/account` | None | Authenticated, recently confirmed | 204 |

No mutation requires `current_password`. A valid passkey confirmation will therefore satisfy deletion and password changes without a second raw-password proof. The new password must be at least 12 characters and match its confirmation.

Unverified email correction is restricted to changing the email while retaining the current name. Other profile edits and application content remain blocked. Email addresses are normalized to lowercase, uniqueness and all other fields are validated before mutation, and verification is cleared atomically with the email write. Tokens issued to the former address are removed. The new verification notification is sent after the database transaction commits. A mail failure leaves the saved address unverified; resend remains available. Old signed links fail their current-email hash check.

## Factor integration contract

The pinned pair is PHP `laravel/passkeys` 0.2.1 with Fortify 1.39.0, and browser `@laravel/passkeys` 0.4.0. Use `Passkeys.register({ name })` for enrollment, `Passkeys.verify()` for login, and `Passkeys.verify({ routes: { options: '/passkeys/confirm/options', submit: '/passkeys/confirm' } })` for confirmation. A 423 response requires confirmation and a fresh options request before retrying the intended ceremony. Cancellation or unsupported WebAuthn leaves password login available. Never retain credential payloads, QR/manual secrets, or recovery codes in logs, analytics, or persistent frontend storage.

| Method and path | Success |
| --- | --- |
| GET `/user/passkeys/options` | `{ "options": <WebAuthn creation options> }` |
| POST `/user/passkeys` | Input `name`, `credential`; 200 `{ "status": "passkey-registered", "id": "<UUIDv7>", "name": "..." }` |
| GET `/user/passkeys` | 200 `{ "data": [{ "id": "<UUIDv7>", "name": "...", "createdAt": "...", "lastUsedAt": null }] }`; authenticated and verified, no recent proof needed for safe metadata |
| DELETE `/user/passkeys/{UUIDv7}` | 200 `{ "status": "passkey-deleted" }` |
| GET `/passkeys/login/options`, `/passkeys/confirm/options` | `{ "options": <WebAuthn assertion options> }` |
| POST `/passkeys/login`, `/passkeys/confirm` | Input `credential`, optional `remember`; 200 package status response |

All ceremonies require user verification. Options expire after 60 seconds server-side and are bound to the session, purpose, and current user. A submission reaching the ceremony middleware consumes state even when malformed or invalid. Each new options request replaces any older ceremony. Session blocking serializes competing options/submissions. Verification failures return generic 422 `credential` errors without reporting credential-bearing exceptions. Request a fresh challenge to restart.

Authenticator routes use native Fortify bodies: enable with POST `/user/two-factor-authentication`, confirm with POST `/user/confirmed-two-factor-authentication` and `code`, remove with DELETE `/user/two-factor-authentication`. Each returns 200. QR GET `/user/two-factor-qr-code` returns `svg` and `url`; manual-secret GET `/user/two-factor-secret-key` returns `secretKey`. GET `/user/two-factor-recovery-codes` returns an array of strings; POST at the same path replaces them and returns 200. Pending enrollment does not challenge password login. Confirmed enrollment makes POST `/login` return `{ "two_factor": true }`; POST `/two-factor-challenge` accepts `code` or `recovery_code`, returning 204 on completion. Recovery codes are single-use; regeneration invalidates the old set. Invalid factor input is 422, invalidated or expired pending password proof is 401.

Fortify's superseded `user-profile-information.update` and `user-password.update` features remain disabled. Do not enable them alongside settings routes.

`routes/auth.php` applies `verified` and `password.confirm` to vendor factor routes when registered, before route compilation:

- `two-factor.enable`, `two-factor.confirm`, `two-factor.disable`
- `two-factor.qr-code`, `two-factor.secret-key`
- `two-factor.recovery-codes`, `two-factor.regenerate-recovery-codes`
- `passkey.registration-options`, `passkey.store`, `passkey.destroy`

QR codes, manual secrets, and recovery-code reads are sensitive disclosures. Login, confirmation, verification notice/resend, reset, and logout stay outside a blanket verified/confirmation requirement. Every factor mutation and secret-read endpoint uses the same boundary.

## Credential and session invalidation

Every native Login event seeds `password_hash_<guard>` immediately, including sessions idle since login. It clears old confirmation and pending login/passkey state. The web group uses Laravel `AuthenticateSession`, which compares the stored credential hash on every authenticated request. Password changes and native password resets rotate the credential hash and remember token. A settings password change rotates the current session ID and the framework stores the new hash for that session; other sessions and old remember cookies fail on their next request. Reset revokes every existing authenticated session.

The `TwoFactorAuthenticationChallenged` event binds pending password proof to the actual accepted user's credential hash using server-only `login.credential_hash` and `login.issued_at`, alongside Fortify's `login.id` and `login.remember`. The proof expires after 300 seconds. `ValidatePendingPasswordProof` checks the current stored credential on subsequent web requests, including factor completion. Missing, malformed, expired, changed/reset, and deleted-account proof is cleared; factor endpoints return 401 and require fresh password login. U8 must retain this event and middleware when enabling its package pipeline, and prove that valid TOTP/recovery input cannot complete an old password challenge. No client-supplied hash is accepted.

Deletion removes reset tokens, the configured user's passkey relation, the account, and its Spatie permission/role pivots in one database transaction. Factor secrets on the user row disappear with that row. The default passkey foreign key also cascades. Other sessions, pending factors and remember cookies cannot resolve the deleted identity. After commit, `logoutCurrentDevice()` clears current authentication and the session is invalidated. Do not replace it with `logout()` after model deletion: remember-token cycling can save and reinsert an already deleted Eloquent user. A database deletion failure rolls back cleanup and retains the current session.

HTTP integration uses an ephemeral test authenticator with genuine signatures and the unmodified package verifier. The account-browser helper uses separate cookie jars and Laravel's array-backed session handler. This does not replace the mandatory U10-U14 live browser ceremony on the generated application.
