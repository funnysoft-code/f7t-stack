# U11 account implementation review

Date: 2026-09-08. Implementation and agent browser review complete. Changes are uncommitted. Revised screenshot approval remains with the owner; this report does not establish release readiness.

## Visual comparison

Compare `mock.png` with `route.png`, and `mock-mobile.png` with `route-mobile.png`. These are the selected Companion B composition and the real `/settings/profile` route. Additional desktop and phone captures live in `routes/`, covering home, profile, security, passkeys, authenticator, recovery, deletion, confirmation, login, registration, forgot/reset password, challenge, verification, and backend outage.

The production view retains the top navigation, broad form column, narrower security companion, restrained borders, and red action. Removing the mock toolbar moves the account header upward by about 65px. Real identity and verification data replace sample content. The companion directs users to their passkeys rather than inventing a count. Longer fixture email addresses scroll inside their input on phones without widening the page.

Measured runtime values:

| Property         | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| Background       | `rgb(9, 9, 9)`                                         |
| Primary action   | `rgb(230, 36, 37)`                                     |
| Primary label    | `rgb(0, 0, 0)`                                         |
| Font             | `"Space Grotesk Variable", sans-serif`, loaded locally |
| Desktop viewport | 1440 × 900                                             |
| Phone viewport   | 390 × 844                                              |

The phone form comes before its companion and the primary action fills the available width. Final captures wait for fonts, request reduced motion, and disable screenshot animations. Earlier viewport-change captures caught a width transition and were replaced. No horizontal page overflow was found in the measured account routes.

Agent critique: production preserves the selected hierarchy and spacing. Short security forms leave substantial open space beside the tall companion, consistent with the chosen composition. The companion and lower profile actions require scrolling on phones. No further visual change was made pending owner review. Screenshots deliberately show safe states, with no passwords, setup keys, QR secrets, recovery codes, or signed links.

## Delivered behavior

- Account home and complete authentication/settings routes, including loading, failure, and upstream-unavailable states.
- Capability-controlled registration, including closed registration and stale submissions.
- Password and passkey login, remember-device choice, TOTP and recovery-code challenges.
- Signed email verification, resend, email-change restriction, and unverified email correction.
- Profile, password, credential removal, authenticator, recovery, and deletion actions with password-or-passkey confirmation and one explicit retry.
- UUID credential metadata through `data.uuid`, supported Laravel passkey adapters, generated response types, and private server reads.
- Native Horizon continuations and existing browser cookie/Origin/Referer protections.

Backend changes address demonstrated UI blockers only. The user resource now exposes safe `two_factor_enabled` and `two_factor_confirmed` booleans. Fortify's passkey configuration now uses the frontend relying-party origin because Fortify 1.39 overwrites the separate package configuration during boot. Both changes have regression tests and regenerated contracts.

## Real Laravel browser evidence

System Chrome, controlled through dev-browser CDP, exercised the assigned fixture at Next `localhost:3042` and Laravel `127.0.0.1:8042`, database `f7t_u5_api`.

Completed real journeys:

- Public registration, required verification, and verification through actual SMTP mail. Registration was restored to disabled afterward.
- CDP virtual-authenticator passkey enrollment, sign-out, passkey login, fresh passkey confirmation, and removal.
- Authenticator QR/manual-key enrollment and confirmation, recovery-code regeneration, fresh TOTP login, recovery-code login, and authenticator removal.
- Email change restricted account access. Correction, resend, and SMTP verification restored access.
- Password change kept the changing session and revoked an independent browser session.
- SMTP password reset revoked the old session and allowed login with the new password.
- Native Horizon guest redirect, Next login, and authorized native dashboard continuation.
- Account deletion, failed subsequent login, and revocation of an independent active session.
- Stopped Laravel produced `Account unavailable` on the protected Next page, rather than a guest redirect. See `routes/outage*.png`.

The initial live outage-retry check was interrupted when both isolated Chrome processes exited normally. The follow-up below closes that evidence gap with a real Laravel retry. The earlier review account was deleted through the UI; the prior registration-review fixture account was no longer present when the follow-up ran.

### Live outage retry follow-up

On 2026-09-08, relaunched the same isolated Chrome profile on CDP port 9242. Created a dedicated verified `Outage retry review` user only in `f7t_u5_api`, using a random password passed through process-local stdin to PHP and dev-browser. No credential file was created. Signed in through the real UI and confirmed `/settings/profile` displayed `Personal details` and the dedicated identity.

Stopped the owned `artisan serve` parent and its PHP listener with `kill -TERM 77900 77938`, after checking their command lines and fixture path. Reloading the protected page displayed `Account unavailable`, retained `/settings/profile`, and had zero `Sign in` headings. Its actual action was `Retry loading this page`.

Restarted Laravel from the same fixture's `services/api` directory with the exact prior public-origin configuration:

```sh
FUNNYSOFT_REGISTRATION_ENABLED=false FRONTEND_URL=http://localhost:3042 APP_URL=http://127.0.0.1:8042 SESSION_SECURE_COOKIE=false APP_CONFIG_CACHE=/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u11-config.php APP_ROUTES_CACHE=/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u11-routes.php php artisan serve --host=127.0.0.1 --port=8042 --no-reload > /dev/null 2>&1
```

Clicked the rendered Retry button through dev-browser, without navigating manually or signing in again:

```js
const page = await browser.getPage("u11-outage-retry");
await page.getByRole("button", { name: "Retry loading this page", exact: true }).click();
await page
  .getByRole("heading", { name: "Personal details", exact: true })
  .waitFor({ timeout: 15000 });
```

Result: `/settings/profile` restored, the full-name field still equaled `Outage retry review`, and both unavailable and sign-in heading counts were zero. The same browser session remained authenticated across backend shutdown and restart. No production defect or code change was needed. The safe restored screenshot, `routes/outage-retry-restored.png`, was inspected at 1440 × 900 with fonts ready and animations disabled.

Browser handoff remains live. After the background Chrome process exited normally following the initial handoff, Chrome was relaunched detached with the same isolated profile. A fresh navigation to the protected profile confirmed the same authenticated identity remained available. The target ID below reflects that relaunch:

- CDP: `http://localhost:9242`
- dev-browser browser name: `u11-main`
- Named page: `u11-outage-retry`
- Target ID: `54B58892C77B4377FC0EC9989ABCBBC2`
- Current page: `http://localhost:3042/settings/profile`

```sh
dev-browser --browser u11-main --connect http://localhost:9242
```

Automation notes: an initial login check waited for `/app`, while the valid continuation went directly to `/settings/profile`. A subsequent targeted heading/identity check confirmed successful login. An initial broad DOM snapshot unexpectedly included a restored password-field value. The field was cleared, the value was not reused, and subsequent checks used only safe targeted fields. The prior registration-review account could not be found for rotation; the retry used the fresh dedicated account above. No password or cookie is included in this report or its screenshot.

## Deterministic tests and red evidence

Playwright uses the explicit fake HTTP backend in `e2e/backend.mjs` for repeatable SSR and browser states. Its results are separate from the live Laravel journeys above. It covers 20 desktop/phone cases across 13 registered workflow tags.

Failures that guided the implementation:

- Account-state regression failed with `Failed asserting that null is identical to false` before factor booleans were exposed.
- Flow tests failed before `flows.ts` existed. A continuation test expected `/settings/passkeys` but received `/app`. An unsupported-passkey test initially received a generic failure message.
- Real WebAuthn enrollment returned 422, `Unable to verify passkey. Start again.` Safe verifier file/line diagnostics identified `CheckAllowedOrigins.php:120`. The regression expected frontend origin `http://localhost:3042` but received private API origin `http://localhost:8000` before the Fortify fix.
- Transport checks exposed missing dependency symlinks in copied workspace packages and a generated-contract trailing-newline mismatch. Both were corrected.
- One enrollment-step TOTP was rejected when reused for login. Login succeeded with a fresh time-step code.

Temporary verifier diagnostics were removed. Command-line environment overrides require `artisan serve --no-reload` so the child process retains the supplied frontend origin.

## Verification commands

Commands below ran in the installed fixture unless a source-root path is shown. PHP commands ran in its `services/api` directory.

| Command                                                                                                                                                                        | Result                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `F7T_TRANSPORT_DATABASE=f7t_u5_api F7T_CHROMIUM_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun run test`                                        | 11 files, 116 tests passed. Authored libraries: 100% statements, branches, functions, lines. Includes real session/account/Horizon transport and fresh-backend contract regression. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun run test:e2e`                                                          | 20 passed; production frontend rebuilt successfully.                                                                                                                                |
| `bun run typecheck`                                                                                                                                                            | Passed, including final repeat.                                                                                                                                                     |
| `bun run doctor`                                                                                                                                                               | No issues in 59 files.                                                                                                                                                              |
| `FUNNYSOFT_REGISTRATION_ENABLED=true bash scripts/generate-api-client.sh --check`                                                                                              | Passed.                                                                                                                                                                             |
| `bun run check:workflows`                                                                                                                                                      | 13 registered jobs have Playwright tags.                                                                                                                                            |
| `php -d pcov.directory="$PWD" -d pcov.initial.files=4096 vendor/bin/pest --compact --coverage --min=100 --filter='^(?!.*keeps Redis session state)'`                           | 93 passed, 839 assertions, 100% coverage. The known Redis-clearing test was excluded per assignment.                                                                                |
| `vendor/bin/pest --type-coverage --min=100 --compact`                                                                                                                          | 100% type coverage.                                                                                                                                                                 |
| `vendor/bin/phpstan analyse --level=max --memory-limit=2G --no-progress`                                                                                                       | No errors.                                                                                                                                                                          |
| `vendor/bin/pint --test Modules/Identity/Http/Resources/UserResource.php Modules/Identity/Tests/Http/AccountSummaryTest.php config/fortify.php`                                | Passed.                                                                                                                                                                             |
| `vendor/bin/rector process Modules/Identity/Http/Resources/UserResource.php Modules/Identity/Tests/Http/AccountSummaryTest.php config/fortify.php --dry-run --no-progress-bar` | Passed, no changes proposed.                                                                                                                                                        |
| `git diff --check`                                                                                                                                                             | Passed from source root.                                                                                                                                                            |

Source-root formatter check passed on 92 files:

```sh
bunx oxfmt --check template/stacks/api-next/apps/web template/stacks/api-next/packages/design-system/account.css template/stacks/api-next/packages/design-system/generated template/stacks/api-next/packages/design-system/package.json template/stacks/api-next/packages/design-system/tsconfig.json template/stacks/api-next/e2e template/stacks/api-next/playwright.config.ts template/stacks/api-next/tests/integration/servers.ts template/stacks/api-next/tests/workflows.yml
```

Final source-root lint passed with zero warnings/errors on 83 files:

```sh
bunx oxlint --deny-warnings template/stacks/api-next/apps/web template/stacks/api-next/packages/design-system/generated template/stacks/api-next/e2e template/stacks/api-next/playwright.config.ts template/stacks/api-next/tests/integration/servers.ts
```

Source and fixture production builds passed with Turbopack and webpack. Upstream shadcn components retain the existing generated-code coverage exclusion; authored request libraries remain fully covered.

A final byte comparison checked 87 changed source/fixture files. Production frontend, PHP changes, generated contracts, and lockfile matched exactly. The only differences were formatting in `playwright.config.ts` and `tests/integration/servers.ts`, plus the fixture's older `AUTH.md` documentation. Source has no `.next`, TypeScript build-info, or Playwright result directories. Temporary account credentials, signed-mail links, and TOTP files were removed after browser work.

React Doctor exceptions are confined to named files in `apps/web/doctor.config.ts`: `no-prevent-default` permits six JSON forms to preserve browser-visible Laravel cookie mutations, and `clickjacking-redirect-risk` permits the server gate's tested local/signed continuation validators.

## Remaining review boundaries

Owner approval of revised desktop and phone screenshots is pending. Local HTTP localhost WebAuthn proof does not establish stable HTTPS/custom-host deployment behavior. No deployment or release claim is made. No git index, commit, push, Linear, Inertia, root CLI, or global configuration changes were performed for U11. The unrelated root `lefthook.yml` remains untouched.
