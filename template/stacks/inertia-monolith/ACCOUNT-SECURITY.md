# Account security contract

## Settings and recent confirmation

The native Fortify confirmation endpoints remain authoritative:

- `POST /user/confirm-password`, body `{ "password": "..." }`, returns 201 on success and 422 on a wrong password.
- `GET /user/confirmed-password-status` returns `{ "confirmed": true|false }`.
- The server session key is `auth.password_confirmed_at`, written by Laravel's `session()->passwordConfirmed()`. The lifetime is `auth.password_timeout`.
- Sensitive JSON requests return 423 when confirmation is missing or expired. HTML requests redirect to the native confirmation page. U10 should preserve the intended local action, perform confirmation, then retry that action once.
- A future supported passkey confirmation ceremony must use the package controller, which verifies the credential before calling `passwordConfirmed()`. Merely logging in with a passkey must not set this timestamp. U7 tests the shared timestamp boundary, not a WebAuthn ceremony.

| Method and path | Input | Boundary | Success |
| --- | --- | --- | --- |
| PATCH `/settings/profile` | `name`, `email` | Authenticated; unchanged email requires verified account; changed email requires recent confirmation | 204 |
| PUT `/settings/password` | `password`, `password_confirmation` | Authenticated, verified, recently confirmed | 204 |
| DELETE `/settings/account` | None | Authenticated, recently confirmed | 204 |

No mutation requires `current_password`. A valid passkey confirmation will therefore satisfy deletion and password changes without a second raw-password proof. The new password must be at least 12 characters and match its confirmation.

Unverified email correction is restricted to changing the email while retaining the current name. Other profile edits and application content remain blocked. Email addresses are normalized to lowercase, uniqueness and all other fields are validated before mutation, and verification is cleared atomically with the email write. Tokens issued to the former address are removed. The new verification notification is sent after the database transaction commits. A mail failure leaves the saved address unverified; resend remains available. Old signed links fail their current-email hash check.

## Route inventory and U8 integration

Fortify's superseded `user-profile-information.update` and `user-password.update` features remain disabled. Do not enable them alongside settings routes.

`routes/auth.php` applies `verified` and `password.confirm` to vendor factor routes when registered, before route compilation:

- `two-factor.enable`, `two-factor.confirm`, `two-factor.disable`
- `two-factor.qr-code`, `two-factor.secret-key`
- `two-factor.recovery-codes`, `two-factor.regenerate-recovery-codes`
- `passkey.registration-options`, `passkey.store`, `passkey.destroy`

QR codes, manual secrets, and recovery-code reads are sensitive disclosures. Login, confirmation, verification notice/resend, reset, and logout stay outside a blanket verified/confirmation requirement. U8 owns factor enablement, real ceremonies, safe passkey metadata listing, and the factor-completion integration tests. Any additional factor mutation or secret-read endpoint must use the same boundary.

## Credential and session invalidation

Every native Login event seeds `password_hash_<guard>` immediately, including sessions idle since login. It clears old confirmation and pending login/passkey state. The web group uses Laravel `AuthenticateSession`, which compares the stored credential hash on every authenticated request. Password changes and native password resets rotate the credential hash and remember token. A settings password change rotates the current session ID and the framework stores the new hash for that session; other sessions and old remember cookies fail on their next request. Reset revokes every existing authenticated session.

The `TwoFactorAuthenticationChallenged` event binds pending password proof to the actual accepted user's credential hash using server-only `login.credential_hash` and `login.issued_at`, alongside Fortify's `login.id` and `login.remember`. The proof expires after 300 seconds. `ValidatePendingPasswordProof` checks the current stored credential on subsequent web requests, including factor completion. Missing, malformed, expired, changed/reset, and deleted-account proof is cleared; factor endpoints return 401 and require fresh password login. U8 must retain this event and middleware when enabling its package pipeline, and prove that valid TOTP/recovery input cannot complete an old password challenge. No client-supplied hash is accepted.

Deletion removes reset tokens, default `passkeys.user_id` rows when that table exists, the account, and its Spatie permission/role pivots in one database transaction. U8's factor secrets on the user row disappear with that row. If U8 changes the package table/model storage, adapt this cleanup transaction. Other sessions, pending factors and remember cookies cannot resolve the deleted identity. After commit, `logoutCurrentDevice()` clears current authentication and the session is invalidated. Do not replace it with `logout()` after model deletion: remember-token cycling can save and reinsert an already deleted Eloquent user. A database deletion failure rolls back cleanup and retains the current session.

The test browser helper uses separate cookie jars and Laravel's array-backed session handler, not shared Redis flushes. Real WebAuthn verification and production UI remain U8/U10 work.
