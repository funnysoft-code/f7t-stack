# U14 packed live verification

Date: 2026-09-09. Final stable local HTTPS acceptance passed on both Laravel variants from tarball `a52c1dee34680c80ed9ee9c535717667ba7522f067931dea1dd899254906921c`, with standards `v0.3.1`. The final acceptance section below supersedes the earlier artifact's blocker status. Hosted preview/provider activation and any subsequent archive-parity decision remain coordinator-owned.

## Final packed HTTPS acceptance

### Coordinator parity verification

The coordinator independently verified the SHA-256 of `runtime-application-hashes.json` as `a5d937bc448fbb7483949c36f4a7abfcabcc9524817182da514239f8fa20912f`. All 359 listed files match both current source and the final candidate archive `a8076d66f6eb4d6c82144724e703da5afad03a186c1516cabf4961724de05605`. The complete archive delta contains only three corrected PHP test files and their manifest hashes. The HTTPS evidence therefore applies to the final candidate's unchanged runtime. This comparison is not a claim that the later archive was used in the browser run.

### Exact identity and owned fixtures

The final run extracted this tarball directly into a new worker-owned directory and generated both applications with its executable CLI:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-final/packed/create-f7t-app-0.2.0.tgz
```

Identity verified before extraction:

- Tarball SHA-256: `a52c1dee34680c80ed9ee9c535717667ba7522f067931dea1dd899254906921c`.
- Generator/template: `0.2.0`.
- Standards release: `v0.3.1`.
- Standards commit: `13889e25ab3df8a06307156722dc08377183b356`.
- Standards digest: `9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42`.
- Coordinator-supplied source checkpoint: `abbf4bc`, including the safe-form and trusted-proxy/no-store application changes.

Call the following worker-owned directory `FINAL`:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-final-https
```

The other worker's `u14-release-031-final/packed/fixture-192` and `fixture-193` were not modified.

| Setting           | Inertia                           | API + Next                                |
| ----------------- | --------------------------------- | ----------------------------------------- |
| Generated root    | `$FINAL/inertia`                  | `$FINAL/api`                              |
| Public origin     | `https://u14-packed-inertia.test` | `https://u14-packed-api.test`             |
| PHP listener      | `127.0.0.1:8054`                  | `127.0.0.1:8055`                          |
| Next listener     | Not applicable                    | `3054`, production `next start`           |
| Database          | `f7t_inertia_860e125c`            | `f7t_api_cd8b5c5e`                        |
| Redis prefix      | `f7t_inertia_860e125c:`           | `f7t_api_cd8b5c5e:`                       |
| Herd SMTP mailbox | `u14-final-inertia`               | `u14-final-api`                           |
| Trusted proxies   | `127.0.0.1,::1`                   | Empty for the direct private API listener |

Both session configurations used Secure cookies with no configured cookie domain. PostgreSQL used `5432`, Redis `6379`, and Herd SMTP `2525`. Redis queues and Horizon prefixes used the corresponding dedicated database-derived names. Existing approved Herd proxies and certificates were used without modification.

Generation and setup commands:

```sh
# From FINAL, after extracting the verified tarball into package/
node package/create-f7t-app.js inertia --stack inertia-monolith --yes --json --skip-install --no-git
node package/create-f7t-app.js api --stack api-next --yes --json --skip-install --no-git

# From each generated application root, after its dedicated .env was prepared
bun run setup
bun run build
```

Both setup and build commands exited zero. Both setup receipts report `initialized`; migrations completed before contract/Wayfinder/type generation. Existing Composer authentication was used normally without reading credentials. No schema fallback or application patch was needed.

Runtime commands:

```sh
# FINAL/inertia
herd php artisan serve --host=127.0.0.1 --port=8054 --no-reload

# FINAL/api/services/api
herd php artisan serve --host=127.0.0.1 --port=8055 --no-reload
herd php artisan horizon

# FINAL/api
bun run start --port 3054
```

The Next frontend used a production build throughout the final acceptance run. Laravel remained in the documented local environment for SMTP and local services. Turnstile was explicitly disabled in backend/frontend configuration for these core account journeys. No production dummy-key bypass, fake Siteverify response, production credential or hosted-provider claim is part of this result.

### Final acceptance results

Both stacks passed the following live HTTPS conditions. Earlier U10/U11 and old-tar results were not used as substitutes.

| Acceptance | Final observed evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AE3        | Registration disabled: zero signup links and direct same-origin registration POST `404`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| AE4        | Enabled registration exposed signup and created an unverified ordinary account. Roles and permissions were both zero. Its real HTTPS mail link completed verification. An open signup form submitted after disabling registration returned `404`; no stale account remained.                                                                                                                                                                                                                      |
| AE5, AE7   | The first-user command created an unverified account with zero roles/permissions. Password login required verification. Verification, correction, resend and logout worked. Scoped read-only Herd mailbox queries retrieved actual HTTPS verification and reset links.                                                                                                                                                                                                                            |
| AE6        | Name editing persisted. Email change required recent confirmation and restricted the account. An independent session lost application access. Unverified correction exposed only the email field, retained the name, delivered mail to the corrected address, and reverification restored access. Resend produced a second matching message in each mailbox.                                                                                                                                      |
| AE8        | Genuine CTAP2/internal/resident/user-verified Chrome virtual authenticators enrolled, listed, logged out, logged in, confirmed sensitive actions and removed credentials. RP IDs and allowed origins were the exact HTTPS hostnames. Unrelated RP requests failed with `SecurityError`. Removed credential assertions returned `422`.                                                                                                                                                             |
| AE9        | Browser-only cancellation and unsupported errors produced clear messages while retaining password login. Real password fallback succeeded afterward. These injected failure states are distinguished from the genuine successful WebAuthn ceremonies.                                                                                                                                                                                                                                             |
| AE10       | Accounts worked before enrollment. Real QR images loaded and manual setup keys were available without disclosure in evidence. Fresh TOTP confirmation and password-login challenge succeeded. Recovery login succeeded, the used code disappeared, regeneration replaced all eight codes, an old-set code failed, and a new-set code succeeded. Passkey login worked while TOTP was enabled. Authenticator removal used genuine passkey confirmation; subsequent password login required no TOTP. |
| AE13       | Deletion signed out the current session, rejected password login, rejected a signed assertion from the deletion-proof passkey with `422`, and revoked an independent session. Both primary and registration accounts were deleted through the UI.                                                                                                                                                                                                                                                 |

Password change returned `204`, retained the current session and revoked the independent session. HTTPS SMTP password reset succeeded, revoked the existing session and accepted the reset password on a fresh login. These checks ran on both final fixtures.

Request-count evidence from the revised components:

- Passkey metadata page: one `GET 200` after navigation, with no repeated read loop.
- Recovery disclosure: one `GET 200`.
- Recovery regeneration: one `POST 200`, with all eight displayed values replaced.
- TOTP enable after passkey login: exactly `[423, 200]`, using genuine passkey confirmation and one retry.
- Passkey removal after fresh login: exactly `[423, 200]`, again using genuine confirmation and one retry.

### HTTPS transport, form safety and cache checks

Both hosts validated normally in system Chrome over TLS 1.3 with the existing trusted Herd certificates. No ignore-certificate flag or browser security weakening was used. Both pages had zero insecure script/link references. Inertia now rendered normally behind the approved proxy.

Both session and XSRF cookies had `Secure`, `Path=/`, `SameSite=Lax`, and no `Domain` attribute. Session cookies had `HttpOnly`; XSRF cookies remained readable by the client. Guest and post-login session cookies were privately decrypted with each dedicated application's encrypter. Both underlying session IDs were valid 40-character values and changed at login. This proves session-ID rotation rather than merely changed ciphertext.

Real UI profile PATCH requests carried the exact HTTPS Origin and an XSRF header and persisted successfully. API invalid-token PATCH returned `419`. Inertia's native request-forgery middleware accepted same-origin browser metadata before checking the token, so the negative test used an explicit cross-site Origin/fetch-site and invalid token against the real HTTPS endpoint. System `/usr/bin/curl`, with normal certificate validation and private cookie headers supplied on stdin, received `419`. No credential value was printed.

Separate Chrome profiles showed their own account names in profile content, and each response lacked the other account's name. The production Next response included its correct identity in server HTML. Protected cache headers were:

```text
Inertia: no-store, private
Next: private, no-cache, no-store, max-age=0, must-revalidate
Horizon HTML/API: private, no-store
```

JavaScript-disabled testing used only the nonsecret sentinel `U14_NONSECRET_SENTINEL`. Inertia exposed no form while its client application was unavailable. Next server HTML exposed `method="post"` with a disabled fieldset and disabled inputs. A deliberately forced native fallback produced POST, never a password or sentinel query parameter. Real credentials were entered only in the hydrated live flows. The final evidence-log scan found zero matches for the run's private passwords or signed links.

### Native Horizon and real outage/retry

The final API run proved all traffic through `https://u14-packed-api.test`:

1. Ordinary verified account: dashboard `403` with `private, no-store`.
2. Database-asserted operator grant of `view-horizon` to the exact owned account.
3. Independent guest entered native Horizon, completed frontend password and fresh TOTP login, and continued to the native dashboard.
4. Active native dashboard, stats and workload endpoints returned `200`, all with `private, no-store`.
5. Operator revoke changed dashboard and stats to `403` in the existing session, retaining no-store.

The operator grant/revoke used only database `f7t_api_cd8b5c5e`. No permission-management application feature was added.

For outage proof, the owned API listener was stopped after PID/cwd verification. Reloading the authenticated production Next profile displayed `Account unavailable`, no Sign in heading and the actual Retry button. The response retained private/no-store. Restarting the same API and clicking Retry restored the same profile identity without logging in again. No manual navigation substituted for the retry action.

### Final evidence and application parity boundary

Safe artifacts under `FINAL`:

```text
browser-evidence.log
inertia-setup.log
api-setup.log
inertia-build.log
api-build.log
runtime-application-hashes.json
evidence/u14-final-inertia-profile-desktop.png
evidence/u14-final-inertia-profile-mobile.png
evidence/u14-final-api-profile-desktop.png
evidence/u14-final-api-profile-mobile.png
evidence/u14-final-api-horizon.png
evidence/u14-final-api-outage.png
evidence/u14-final-api-retry.png
evidence/u14-final-inertia-deleted.png
evidence/u14-final-api-deleted.png
```

`runtime-application-hashes.json` records 359 packed application/configuration/setup/dependency-lock file hashes. It excludes test directories, inline test/spec files, test-runner configuration, docs, design mocks, harness/CI trees, Markdown and images. Its SHA-256 is `a5d937bc448fbb7483949c36f4a7abfcabcc9524817182da514239f8fa20912f`. The broader initial file inventory remains as `application-file-hashes.json`; use the explicitly scoped runtime manifest for the coordinator's test-only archive comparison.

These manifests describe the extracted `a52c1dee...` artifact. The coordinator must compare any later tarball against them and decide whether its runtime identity is unchanged. This report does not silently claim a future tarball hash or standards release.

Browser scripts ran through `dev-browser`, using system Chrome on CDP `9274` and `9275`. The nonsecret local helpers `run-browser.py`, `runtime.py`, `mail.py` and `totp.py` remain under `FINAL`; private inputs have been removed. The browser log retains both successful checks and driver retries. A forged-header CDP probe left a tab unable to load subresources; opening a clean tab restored normal loading, and the explicit HTTPS curl probe supplied the negative CSRF evidence. One re-enrollment attempt on a previously used virtual authenticator failed verification; a fresh virtual device completed enrollment. No verifier check or application code was changed. A login-continuation assertion was corrected to accept its existing intended profile destination.

Profile captures were inspected at 1440 × 900 and 390 × 844. Both variants measured zero horizontal overflow. The production Next captures have no development toolbar. The selected Companion layout, typography, forms and readable email inputs remain intact. Native Horizon and the restored outage profile were also inspected. Owner screenshot approval remains separate.

### Final cleanup and remaining boundary

Final read-only checks found zero users, zero passkeys and zero reset tokens in both dedicated databases, with registration disabled. The four owned accounts were deleted through their UI flows. Keys, databases, installed dependencies and HTTPS fixture configuration remain; `.env` files have mode `0600`. No shared Redis flush, schema reset or global service mutation was used.

Owned PHP/Next/Horizon processes were stopped. Ports `8054`, `8055`, `3054`, `9274` and `9275` were confirmed closed. Both final Chrome profiles and all private password, cookie, signed-link, virtual-credential and factor-code files were removed. Herd mail and the approved global proxies were left untouched.

The local HTTPS acceptance scope has no remaining application blocker for the exact tested archive. Real hosted Vercel/Laravel Cloud preview behavior, production provider activation and Turnstile credentials remain outside this local proof. Root owns any later archive-parity decision, remaining quality gates and release lifecycle.

## Earlier artifact history: package and fixture identity

The live applications came from the assigned installed packed outputs, not the source templates or the earlier U10/U11 fixtures.

- Package and template revision: `0.2.0`.
- Standards release: `v0.3.0`.
- Standards commit: `ad1eb5249ad747aee34dd8794c2e91ff262a7cd6`.
- Standards asset digest: `4d528586991c72a6f120bf92533365e73fbeeb6ef336ce273bb2a72a0a81415a`.
- Recomputed packed tarball SHA-256: `e262d1eab8b9fd4db0776f5ba5dac492525b3e7a5198bc0d7f434c65412f27ab`.

The tarball is `packed-node/create-f7t-app-0.2.0.tgz` beneath:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-030
```

Call that directory `BASE` in the commands below. Both `F7T_MANIFEST.json` receipts matched the identity above.

| Item                   | Inertia                             | API + Next                          |
| ---------------------- | ----------------------------------- | ----------------------------------- |
| Installed root         | `$BASE/packed-node/fixture-192`     | `$BASE/packed-node/fixture-193`     |
| PHP root               | Installed root                      | `services/api`                      |
| Browser origin         | `http://localhost:8054`             | `http://localhost:3054`             |
| API listener           | Same as browser origin              | `http://localhost:8055`             |
| Database               | `f7t_fixture_192_7bc42ad1`          | `f7t_fixture_193_d267e166`          |
| Redis prefix           | `f7t_fixture_192_7bc42ad1:`         | `f7t_fixture_193_d267e166:`         |
| Horizon prefix         | `f7t_fixture_192_7bc42ad1:horizon:` | `f7t_fixture_193_d267e166:horizon:` |
| Herd mailbox           | `fixture-192`                       | `fixture-193`                       |
| Primary Chrome CDP     | `9254`                              | `9255`                              |
| Independent Chrome CDP | `9256`                              | `9257`                              |

## Setup and isolation

Read-only port checks found PostgreSQL on `5432`, Redis on `6379`, and Herd SMTP on `2525`. The generated `.env` files initially used Redis `6138`, non-dedicated database names and empty application keys. Before setup, fixture-only configuration selected the exact path-derived dedicated databases above, Redis namespaces and queue names, the local origins, and non-secure cookies for this HTTP run. Mail remained SMTP. Existing Composer authentication was consumed by normal installation without reading credentials.

From each installed root:

```sh
bun run setup
bun run build
```

Both commands exited zero in both variants. Both `.f7t/setup-state.json` receipts report `initialized`, with all stages complete: prerequisites, environment, JavaScript dependencies, PHP dependencies, platform, Boost, services, application key, database, migrations and contracts. Setup generated previously absent keys. No key regeneration, database reset, shared Redis flush or global service change was used.

Runtime commands:

```sh
# fixture-192
herd php artisan serve --host=127.0.0.1 --port=8054 --no-reload

# fixture-193/services/api
herd php artisan serve --host=127.0.0.1 --port=8055 --no-reload
herd php artisan horizon

# fixture-193
bun run start --port 3054
# Later local Turnstile journeys used:
bun run dev --port 3054
```

The API production build and server initially passed account and factor journeys. Its production-mode Turnstile guard correctly rejected the local dummy site key on forgot-password. Local registration and reset then ran through `next dev`, with the documented dummy key and real Cloudflare widget/Siteverify. The backend stayed on `APP_ENV=local`. No guard, application source, dependency or key check was weakened. A production frontend requires real Turnstile configuration; this run does not claim production-provider activation.

Registration toggles required restarting the owned `artisan serve --no-reload` processes because their child environment retained the original values. The stale forms stayed open across those restarts. Registration was restored to `false` in both fixtures.

## Browser and mail method

All live UI actions used the `dev-browser` skill and CLI, attached to system Chrome:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9254 \
  --user-data-dir="$BASE/chrome-live" \
  --no-first-run --no-default-browser-check

dev-browser --browser u14-packed --connect http://localhost:9254 --timeout 30
dev-browser --browser u14-api --connect http://localhost:9255 --timeout 30
dev-browser --browser u14-inertia-other --connect http://localhost:9256 --timeout 30
dev-browser --browser u14-api-other --connect http://localhost:9257 --timeout 30
```

The other Chrome processes used the same executable with their respective ports and separate temporary profiles. No browser installer ran. API and Inertia needed separate profiles because their HTTP localhost origins otherwise shared the `XSRF-TOKEN` cookie name across ports. The final API ceremonies and subsequent journeys used the independent API profile.

Herd mail was read through SQLite in `mode=ro` at `~/Library/Application Support/Herd/HerdCoreData.sqlite`. Every message query joined `ZCDMAIL` and `ZCDMAILADDRESS`, restricting both `ZMAILBOX` and the exact owned recipient. Verification and reset links were consumed privately. The initial, corrected-address, resend, reset and registration messages were retrieved from the matching named mailbox. No production Resend credential was used.

Passwords were generated randomly and passed to the first-user command through stdin, never command arguments or stdout. Temporary link, credential and factor-code files were outside the repository and removed at completion. The temporary Next development request log was also removed after detecting signed-link markers. Its contents were not printed. All associated accounts and tokens were deleted before handoff. Screenshots exclude passwords, QR/manual secrets, recovery codes and signed links.

The provisioning commands ran in each fixture's PHP root, with the matching recipient:

```sh
herd php artisan funnysoft:create-first-user --name="U14 Packed Review" --email=u14-fixture-192@example.test
herd php artisan funnysoft:create-first-user --name="U14 Packed Review" --email=u14-fixture-193@example.test
```

## Live acceptance evidence

The results below apply to both packed fixtures unless a variant is named.

| Acceptance | Observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AE3        | With registration disabled, login exposed zero `/register` links. Direct same-origin registration POST returned `404`. No account was created.                                                                                                                                                                                                                                                                                                                                                     |
| AE4        | After enabling registration and applying configuration, signup appeared. The real form created an unverified account. SMTP verification then reached its account home. An already-open form submitted after disabling registration received `404`; database checks found zero stale-submission accounts.                                                                                                                                                                                           |
| AE5        | First password login reached verification instead of application content. Verification, resend, email correction and logout remained reachable. Named Herd mailboxes delivered verification and reset mail.                                                                                                                                                                                                                                                                                        |
| AE6        | Profile name editing persisted. Changing email made the account unverified. An independent authenticated Chrome session lost access to the profile. Unverified correction exposed only the email field, preserved the name, sent mail to the corrected address, and reverification restored access. Each corrected recipient had two messages after resend.                                                                                                                                        |
| AE7        | `funnysoft:create-first-user` with registration disabled created the first unverified ordinary account and sent verification mail. It did not grant a role or permission. Before the explicit Horizon grant, read-only checks found zero roles and zero permissions.                                                                                                                                                                                                                               |
| AE8        | Genuine virtual-authenticator enrollment, metadata listing, logout, passkey login, recent passkey confirmation and removal passed. Removal produced exactly two DELETE responses, `[423, 200]`, demonstrating the intended action retried once after confirmation. Removed credentials failed; password fallback succeeded. A second credential was enrolled for deletion proof.                                                                                                                   |
| AE9        | Browser-only `NotAllowedError` and `NotSupportedError` injection produced understandable cancellation/unsupported messages. Password controls remained usable and real password login succeeded afterward. This is deterministic browser-state evidence, not a physical OS cancellation recording. Inertia also displayed a cancellation state during an unfocused real ceremony.                                                                                                                  |
| AE10       | Accounts worked before 2FA enrollment. Authenticator setup displayed the real manual key/QR workflow, accepted a fresh TOTP and exposed eight recovery codes. Subsequent password login required and accepted a fresh TOTP. Recovery login succeeded, the used code disappeared, regeneration replaced all eight codes, an old-set code was rejected, and a new-set code succeeded. Authenticator removal completed through confirmation, and a later independent password login required no TOTP. |
| AE13       | Account deletion redirected the current session to login. Password login failed. A signed assertion from the enrolled deletion-proof credential received `422`. Independent authenticated sessions lost access. Database checks found no deleted account, passkey or reset-token rows.                                                                                                                                                                                                             |

Additional credential-lifecycle checks passed:

- Password change retained the changing session and revoked the independent session on its next protected request.
- SMTP password reset succeeded through the generated form. Existing authenticated sessions were revoked, and the new password signed in successfully.
- Registration-created accounts were ordinary and unverified before verification: zero roles and zero permissions. They were later verified and deleted through the UI as owned test cleanup.

### WebAuthn details

CDP `WebAuthn.addVirtualAuthenticator` used `ctap2`, `internal` transport, resident credentials, user verification, `isUserVerified=true`, and automatic presence simulation. Successful operations used Chrome-generated signatures and the unmodified Laravel package verifier. No PHP authenticator double was involved.

The page had to be foregrounded before a ceremony. An early unfocused attempt cancelled. Rehydrating an authenticator from an older private snapshot also reproduced a signature-counter rejection; subsequent snapshots retained the updated counter, or the virtual counter advanced before reuse. These were test-driver corrections. No relying-party, origin, signature or counter validation was disabled.

Localhost was a Chrome secure context for WebAuthn. That fact does not prove HTTPS transport or a stable custom relying-party hostname.

## Native Horizon and outage recovery

All Horizon browser traffic used the Next frontend origin on port `3054`.

1. The ordinary verified account received `403` at `/horizon`.
2. A fixture-only operator action granted `view-horizon` to the exact owned corrected-email account using Spatie `givePermissionTo`. The action asserted database `f7t_fixture_193_d267e166` before mutation.
3. `/horizon` rendered the native Laravel Horizon dashboard with status Active. `/horizon/api/stats` and `/horizon/api/workload` returned `200` through Next.
4. An independent guest visited `/horizon`, reached the frontend login, signed in, and continued to the native dashboard.
5. The same fixture-only operator action revoked `view-horizon`. Both the dashboard and stats endpoint returned `403` in the existing frontend session.

The permission grant/revoke was an operator action in the dedicated backend, not a new permission-management UI. Browser access and authorization transitions were verified through the frontend.

For outage proof, the owned API listener and parent were stopped after checking their PIDs, command lines and fixture paths. Reloading `/settings/profile` displayed `Account unavailable`, with zero Sign in headings and a `Retry loading this page` button. After restarting the same backend, clicking that actual button restored `Personal details` and the same account name without another login. No manual navigation replaced the retry action.

## Safe visual evidence

Nine screenshots are retained in `$BASE/live-evidence/`:

```text
u14-inertia-profile-desktop.png
u14-inertia-profile-mobile.png
u14-api-profile-desktop.png
u14-api-profile-mobile.png
u14-api-outage.png
u14-api-retry-restored.png
u14-api-horizon-authorized.png
u14-inertia-deleted-login.png
u14-api-deleted-login.png
```

The desktop profile captures use 1440 × 900; phones use 390 × 844. Both phone profiles measured zero horizontal overflow. Rendered profile images were inspected directly. They retain the selected Companion hierarchy, Space Grotesk typography, dark surfaces and red actions. Long email addresses scroll within their inputs. The API mobile primary action fills the form width; Inertia retains its narrower button. These existing variant differences were recorded, not redesigned. The Next development indicator is visible in local dev captures.

An initial API screenshot caught its loading skeleton. It was replaced only after the actual Personal details heading and fonts were ready. Horizon and outage captures were also inspected. This is agent verification, not owner screenshot approval.

Safe setup/build logs remain at `$BASE/u14-live-inertia-setup.log`, `$BASE/u14-live-api-setup.log`, `$BASE/u14-live-inertia-build.log` and `$BASE/u14-live-api-build.log`. The coordinator's release-matrix and root-check evidence remains separate; no full matrix was rerun by this live worker.

## Initial HTTPS authorization request

Read-only `herd links`, `herd proxies` and `herd secured` inspection found no existing secured host for either packed fixture. Existing secured sites belonged to other projects. No proxy or certificate was created, no existing site was repointed, and no global configuration or cloud resource was changed.

The smallest proposed local HTTPS resources are two dedicated Herd proxies with trusted certificates. These commands require owner/coordinator authorization and were not run:

```sh
herd proxy u14-packed-inertia http://127.0.0.1:8054 --secure
herd proxy u14-packed-api http://127.0.0.1:3054 --secure
```

After authorization, configure only the fixtures: Inertia `APP_URL=https://u14-packed-inertia.test` and secure session cookies; API `FRONTEND_URL=https://u14-packed-api.test` and secure session cookies; Next `FRONTEND_URL=https://u14-packed-api.test`, retaining its private API upstream. Restart owned processes, create fresh owned users and credentials, and repeat verification links, cookie/CSRF mutations, WebAuthn enrollment/login/confirmation and Horizon grant/access/revoke over those stable origins. The stable RP identities require new credentials, not reusing localhost credentials.

Those local resources would establish a stable local HTTPS run only. A deployed stable preview remains a separate authorized deployment decision, including its named hostname and real production Turnstile keys. No cloud preview is claimed or provisioned here.

## Initial cleanup and ownership

Both databases finish with zero users, zero passkeys and zero password-reset tokens. Both primary accounts and both registration accounts were deleted through their real UI flows. Registration is disabled. No shared data was cleared.

The fixtures, dedicated databases, generated keys and installed dependencies remain. Owned PHP/Next processes were stopped; the namespaced Horizon process was terminated. All four temporary Chrome processes were closed and their owned profiles removed. Private temporary passwords, signed links, authenticator snapshots, manual keys and recovery/TOTP files were removed. Herd mail was left untouched because access was read-only; the associated accounts no longer exist.

This worker authored only this repository report. Fixture `.env` configuration and standard setup/runtime outputs were the bounded working changes. Application source fixes, root changes, Git index, commits, release lifecycle and owner approvals remain coordinator-owned.

## Authorized stable HTTPS follow-up

The owner approved the two Herd proxy commands above, and the coordinator executed them successfully before this follow-up. This worker made no further Herd, certificate, DNS or global configuration changes.

The tested artifact remains the original `e262d1eab8b9fd4db0776f5ba5dac492525b3e7a5198bc0d7f434c65412f27ab` tarball, recomputed again before testing. Both installed fixtures still identify standards `v0.3.0`, commit `ad1eb5249ad747aee34dd8794c2e91ff262a7cd6`. Incoming source review fixes and standards `v0.3.1` were not copied into these fixtures. No result below proves a future repacked artifact.

Fixture-only configuration changed:

- Inertia `APP_URL=https://u14-packed-inertia.test`, `SESSION_SECURE_COOKIE=true`.
- API `FRONTEND_URL=https://u14-packed-api.test`, `SESSION_SECURE_COOKIE=true`; private `APP_URL` remained `http://localhost:8055`.
- Next `FRONTEND_URL=https://u14-packed-api.test`, private `API_UPSTREAM_URL=http://localhost:8055`.
- Session domains remained unset. Dedicated databases, Redis namespaces and application keys were preserved.

System Chrome used fresh profiles on CDP ports `9264` and `9265`. Both hosts completed ordinary certificate validation with TLS 1.3, issuer `Laravel Valet CA Self Signed CN`, and the exact corresponding certificate subject. No ignore-certificate flag, HTTPS-error bypass or browser security override was used. Both browser contexts reported a secure context.

Runtime commands used the original fixture paths:

```sh
# Inertia PHP root
herd php artisan serve --host=127.0.0.1 --port=8054 --no-reload

# API PHP root
herd php artisan serve --host=127.0.0.1 --port=8055 --no-reload

# API workspace root, after the development-host correction below
bun run dev --hostname u14-packed-api.test --port 3054

dev-browser --browser u14-https --connect http://localhost:9264
dev-browser --browser u14-https-other --connect http://localhost:9265
```

All owned application process output went to `/dev/null` during this follow-up to avoid retaining request URLs containing signed links.

### HTTPS blockers and findings

1. **Inertia cannot render behind the approved proxy with the packed local configuration.** HTTPS `/login` returned `200` with a normally trusted certificate, but its HTML emitted HTTP script, stylesheet and preload URLs. Chrome blocked mixed content and the body remained blank. The last check found 30 insecure script/link references. `bootstrap/app.php` has no trusted-proxy configuration; `config/essentials.php` forces HTTPS only in production. `APP_URL=https://...` alone did not correct request-derived URLs. A bounded runtime attempt with `HTTPS=on herd php artisan serve ... --no-reload` also left the URLs on HTTP. No source/config-code workaround was applied. Inertia enrollment, login, confirmation, TOTP and authenticated session behavior are therefore not verified over HTTPS.
2. **The old API login can disclose credentials before hydration.** The initial default `next dev --port 3054` rejected development assets behind the custom hostname with `403`. The visible server-rendered login form submitted natively as GET, adding its password to the URL. A subsequent inspection inadvertently printed that URL to the tool transcript. The affected fixture password was rotated immediately and the account was later deleted. No production secret was involved, and the value is not copied into this report. The dedicated browser profiles were removed; global Herd logs were not altered. The form must remain safe when client JavaScript is unavailable, regardless of the development asset configuration.
3. **The custom development hostname needs explicit runtime configuration.** Restarting Next with `--hostname u14-packed-api.test` stopped the development asset `403` responses. After hydration was confirmed, login used the expected HTTPS JSON POST. This runtime correction did not fix the unsafe native form fallback in the old artifact. Local Turnstile remains the documented dummy-key development configuration, not production-provider proof.
4. **Protected Next page cache headers need a repeat on the reviewed artifact.** HTTPS `/settings/profile` returned `Cache-Control: no-cache, must-revalidate` in this development run, not an explicit `no-store`. The API account endpoint and native Horizon responses did return `private, no-store`. Isolated SSR identities passed, but this report does not mark a universal protected-HTML no-store condition as passed.

The coordinator owns fixes and acceptance of these findings. The Inertia correction should establish the intended trusted proxy/scheme contract rather than allowing mixed content. The login fallback needs a browser regression with unavailable or delayed JavaScript and must never serialize a password into a URL.

### API HTTPS evidence

Two fresh ordinary API accounts used the dedicated database. The main account came from the first-user command. A second bounded fixture account was created for identity-isolation proof. Both received verification mail in the `fixture-193` Herd mailbox, retrieved through read-only queries restricted to the exact recipient. Both untouched signed links used `https://u14-packed-api.test` and completed verification through the frontend.

| Condition                 | Observed HTTPS result                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trusted transport         | Normal Chrome TLS validation passed for both custom hosts. No bypass was used.                                                                                                                                                                                                |
| Secure host-only cookies  | Both hosts emitted session and XSRF cookies with `Secure`, `Path=/`, `SameSite=Lax`, and no `Domain` attribute. Session cookies had `HttpOnly`; XSRF cookies remained readable by the client. Browser cookie domains were the exact hostnames, without a parent-domain scope. |
| Real CSRF                 | API profile PATCH with an invalid XSRF header returned `419`. The real UI PATCH returned `200`, carried an XSRF header and exact origin `https://u14-packed-api.test`, and persisted the name change.                                                                         |
| Session rotation          | The guest and post-login session cookies were privately decrypted with the dedicated application's encrypter. Both underlying IDs were valid 40-character IDs and differed. This checks actual session IDs, not randomized encrypted-cookie ciphertext.                       |
| Isolated SSR identities   | Separate Chrome profiles received their own profile names in the server HTML and form fields. Each response lacked the other user's name.                                                                                                                                     |
| WebAuthn RP/origin        | Real enrollment options named RP ID `u14-packed-api.test`. Backend allowed origins contained exactly `https://u14-packed-api.test`. Chrome rejected a request for the unrelated Inertia RP with `SecurityError`.                                                              |
| Genuine passkey lifecycle | CTAP2/internal/resident/user-verified virtual authenticator enrollment, logout, login, sensitive confirmation and removal passed over HTTPS. A removed credential's signed login submission returned `422`. No PHP authenticator double was used.                             |
| Confirmation retry        | Enabling TOTP after passkey login produced POST responses `[423, 200]`. The user confirmed with the genuine passkey, then the intended operation retried once.                                                                                                                |
| TOTP                      | HTTPS setup displayed the manual key workflow and accepted a fresh TOTP. A later password login required another fresh TOTP and completed the native Horizon continuation.                                                                                                    |
| Session revocation        | Password change returned `204`, retained the changing session and forced an independent authenticated session to the login page on its next protected request.                                                                                                                |
| Horizon continuation      | A guest entered `/horizon`, completed frontend password and TOTP login, and reached the native dashboard on the HTTPS frontend origin.                                                                                                                                        |
| Horizon grant/revoke      | A database-asserted operator grant enabled dashboard and stats responses with `200`; revocation changed both to `403` in the existing session.                                                                                                                                |
| API/Horizon no-store      | `/api/auth/me`, `/horizon`, and `/horizon/api/stats` returned `private, no-store`. The revoked Horizon response retained that policy.                                                                                                                                         |

The HTTPS Horizon capture shows Inactive because no Horizon worker was started for this continuation. Native dashboard routing, authentication, authorization and its data requests were the tested conditions. Worker operation and outage/retry were already established in the original local run and were not repeated here.

Two additional safe screenshots were inspected and copied into `$BASE/live-evidence/`:

```text
u14-https-api-profile.png
u14-https-api-horizon.png
```

### Required proof on the next packed artifact

After the coordinator repacks the reviewed backend/frontend fixes and standards `v0.3.1`, record its new tarball hash and both receipts. Do not carry the current artifact's passes forward as new-package proof.

- Repeat the Inertia HTTPS render and complete account/security journeys after the trusted-proxy/scheme correction. Verify asset URLs and signed links use HTTPS without browser exceptions.
- Repeat both variants' native/pre-hydration form behavior with JavaScript unavailable, including login, registration, reset, password confirmation and security forms affected by review fixes. Inspect request methods and query keys without logging values.
- Repeat affected passkey/recovery request counts and confirmation retries from the revised components, then genuine enrollment/login/confirmation/removal on the stable RP hosts.
- Repeat actual Secure host-only cookies, CSRF rejection/success, decrypted session-ID rotation, independent SSR identities and the reviewed protected-response cache policy.
- Repeat native Horizon guest/TOTP continuation, grant/access/revoke and no-store through the HTTPS frontend.

A successful stable local HTTPS run still does not establish a Vercel/Laravel Cloud preview. Named deployed origins, provider configuration, production Turnstile keys and deployment-specific trust/cookie behavior remain separate authorized preview work.

### HTTPS follow-up cleanup

Both API follow-up accounts were deleted through the real HTTPS UI. Final read-only checks in both dedicated databases found zero users, zero passkeys and zero password-reset tokens, with registration disabled. No Inertia account was created during this blocked follow-up.

Owned ports `8054`, `8055` and `3054` were stopped. Both temporary Chrome processes were closed and their owned profiles removed. Private password/link, cookie-observation, virtual-authenticator and TOTP files were removed. The approved Herd proxies remain coordinator-owned. Fixture origins and Secure-cookie configuration remain set to the approved HTTPS hosts for the next attempt; keys, databases and installed dependencies were preserved.
