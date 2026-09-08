# U10 account implementation review

Status: implemented and locally verified. Companion was selected by the owner. Approval of the revised screenshots is still pending. This report records implementation review, not owner sign-off.

## Visual comparison

The selected `mock.png` and `mock-mobile.png` remain unchanged. Production comparisons are `route.png` and `route-mobile.png`, captured at 1440 × 900 and 390 × 844. Thirty route/state screenshots are in `routes/`.

The production profile follows the selected top navigation, active form and 320px security companion. It uses bundled Space Grotesk, the exact dark and red tokens, black primary labels, the selected input boundaries, and the account-ownership section. On mobile the form precedes the companion. The review toolbar in the mock is deliberately absent from the app, so production content starts higher. Real email and factor status replace the mock account values. The email hint explains the actual confirmation and reverification behavior.

Self-review found and corrected:

- Tailwind utility precedence initially restored nested card borders and padding. The account component styles now apply consistently without those extra containers.
- The installed Radix navigation marks active links with an empty `data-active` attribute, not the string `true`. The selector now matches the actual attribute and displays the red underline.
- Navigation links and sign-out initially had different vertical alignment. They now share alignment and touch-target geometry.
- The profile identity title and mobile avatar were oversized relative to the selected mock. They now match the intended scale.
- System light/dark preferences could activate upstream component overrides independently of the selected tokens. The dark variant is now explicit; browser checks confirmed the same exact red action and black label under both system preferences.
- Eager page imports bundled QR and every account page into the entry point. Pages now resolve lazily and passkey code loads only when requested.
- React Doctor findings in both authored and registry components were fixed, including unstable context values, index keys and response-status handling.

All sixteen authenticated route renders in `capture-routes.js` reported no horizontal overflow. Public, registration, challenge, reset and verification captures complete the fourteen screen types. Recovery screenshots do not reveal codes. QR/manual secrets and credential payloads are not stored in the repository.

Measured rendered token contrast:

| Pair                                    | Ratio   |
| --------------------------------------- | ------- |
| Primary black label / exact red primary | 4.64:1  |
| Foreground / background                 | 17.79:1 |
| Muted text / card                       | 7.76:1  |
| Companion supporting text / companion   | 8.27:1  |
| Error text / card                       | 8.04:1  |
| Input boundary / background             | 3.63:1  |
| Focus ring / background                 | 17.79:1 |

Rendered inputs, action buttons and password visibility buttons were 44px or taller. The compact checkbox has an associated 44px-high clickable label. Keyboard submission moved focus to the error summary, the invalid field remained labelled, and destructive-dialog cancellation returned focus to its trigger in Playwright.

## Component reuse

Actual shadcn CLI-installed components are in `resources/js/components/ui/`. The app composes Button, Card, Field, Input, InputGroup, Alert, Dialog, AlertDialog, NavigationMenu, Avatar, Badge, Item, Empty, Skeleton, Separator, Checkbox and Spinner.

The inspected shadcn.io sources are adapted in:

- `components/account/navbar-settings-header.tsx`: route-aware settings header and active indicator from `navbar-settings-header`.
- `components/account/account-change-password.tsx`: password fields, matching feedback and real pending/success flow from `account-change-password`. Current-password proof lives in the shared password-or-passkey dialog rather than imposing a second password requirement after a passkey confirmation.
- `components/ui/qr-code.tsx`: local generation from the server-issued otpauth URI, based on `qr-code`. It accepts the exact black/white QR colors, includes a quiet zone, reserves geometry and exposes failure with a manual-key alternative.

The shadcn audit checklist was run after component generation. Imports and installed dependencies were checked by typecheck, build, lint and browser execution. Registry demonstration timers, fabricated sessions and extra password policy were not retained.

## Live browser evidence

Runtime: system Chrome 152 through `dev-browser`, attached to isolated CDP ports 9240 and 9241. App origin: `http://localhost:8041`. PHP ran from the assigned installed Inertia fixture. PostgreSQL used `f7t_u5_inertia`; the existing PHPUnit configuration used its separate test database. Sessions used the fixture's Redis namespace. Mail used the local log driver. No shared Redis flush or cache clear was used.

Completed through the real UI and backend:

1. First-user command created an unverified account with registration disabled. Password login reached verification. A signed link retrieved from local mail reached the home page.
2. Registration enabled in the fixture exposed signup and created an unverified ordinary account. Resend worked. A stale open signup form was rejected after registration was disabled again.
3. Name editing, email change, unverified email correction and reverification worked. Another independent Chrome session lost application access when the email became unverified.
4. Reset mail was retrieved locally, a new password was set and used to sign in. Password change succeeded after recent confirmation. An independent Chrome session was redirected to login after the password changed.
5. A CDP virtual authenticator used CTAP2, internal transport, resident credentials and required user verification. Real Laravel passkey enrollment, listing, logout, passkey login, passkey confirmation and removal succeeded. The removed credential was rejected and password fallback succeeded. A second enrolled passkey also signed in directly while authenticator 2FA was enabled, matching the supported package behavior.
6. Authenticator enrollment displayed a real QR code and manual key. Confirmation succeeded with a code generated by the installed authenticator library. Password login required and accepted an authenticator code. Recovery-code login worked; regeneration replaced the displayed set. Authenticator removal also succeeded using passkey confirmation.
7. Account deletion signed out the current session. The deleted account could not sign in, and an independent Chrome session lost access. A fresh first-user account was then provisioned and verified for continued local review.

Cancellation and unsupported-browser states were tested deterministically through the browser package with Playwright. Cancellation uses a simulated browser `NotAllowedError`; this is not claimed as a recording of a physical operating-system prompt cancellation. The successful WebAuthn ceremonies above used the real package, backend, database, session and origin verification.

The first WebAuthn attempt exposed an assigned-fixture origin mismatch: its old APP_URL still named an earlier port. Updating that fixture-only public origin to the browser origin fixed the ceremony. No credential or origin checks were weakened.

## Verification commands and results

Commands ran from the assigned installed fixture unless noted otherwise.

| Command                                                                                                                                                      | Result                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `bunx vitest run resources/js/lib/auth/flows.test.ts` in the template, before implementation                                                                 | Red: missing `flows` module.                                                                                 |
| `bash scripts/frontend-gate.sh test`                                                                                                                         | 7 tests passed; authored library coverage 100% lines, statements, branches and functions.                    |
| `bash scripts/frontend-gate.sh typecheck`                                                                                                                    | Passed; regenerates actual Wayfinder and Data contracts.                                                     |
| `bash scripts/frontend-gate.sh doctor`                                                                                                                       | Passed, no issues; no warnings suppressed.                                                                   |
| `bunx react-doctor . --verbose`                                                                                                                              | 100/100, no issues across 59 files.                                                                          |
| `bunx vp lint resources/js e2e playwright.config.ts`                                                                                                         | Passed, zero warnings and errors.                                                                            |
| `bunx vp fmt --check resources/js resources/css/app.css e2e playwright.config.ts tsconfig.json vite.config.ts package.json components.json`                  | Passed after formatting the new component registry configuration.                                            |
| `bun run build`                                                                                                                                              | Passed. Lazy page chunks and a separate passkey chunk emitted.                                               |
| `E2E_BASE_URL=http://localhost:8041 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bunx playwright test` | 7 tests passed.                                                                                              |
| `bash scripts/php-gate.sh all`                                                                                                                               | Passed: Pint, PHPStan max, Rector, 88 Pest tests, 819 assertions, 100% line coverage and 100% type coverage. |
| `dev-browser --connect http://127.0.0.1:9240 --timeout 60 run design/mocks/account/capture-routes.js`                                                        | Sixteen authenticated desktop/mobile captures; zero overflow results.                                        |

The full unscoped formatting check also inspected pre-existing design/history artifacts and reported formatting differences in `ACCOUNT-SECURITY.md`, `FOUNDATION.md`, `design/COMPONENT-REUSE.md` and the U17 mock/review scripts and files. Those historical files were preserved rather than reformatted as part of U10. This is not reported as a passing unscoped formatting gate.

An additional generation defect was found during verification: the transformer's manifest can skip rewriting a generated file replaced by an older copy. The application transformer now uses `withoutManifest()`, so typecheck regenerates the actual declaration content. Optional registration URLs come from Laravel capabilities; a disabled registration route never needs a hand-copied Wayfinder signature.

Wayfinder artifacts are regenerated in the installed app by build/typecheck and ignored in generated projects. They are not bundled as a snapshot of this local environment. The generated Data declaration is included with the typed props. No owner screenshot approval, packed-release matrix or deployment result is claimed here.
