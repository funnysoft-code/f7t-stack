# U13 standards conformance audit

U13 conformance checks are complete with no remaining blockers in this slice. Both Laravel full root checks pass after real Boost installation and synchronization against the final export. All six Next fixtures pass the export-impact lint check, retaining their prior full-check and production-build evidence. No warning suppressions or broad format exemptions were added. This is not U14 release approval.

## Identity and fixtures

The final audit exported a `git archive` of standards commit `a6166be824aa59a00f5b49bdaf0544bc935d9e0f`. The export passed `verifyStandardsBundle` before application. Its audit-only label is `v0.0.0-u13-audit`, with asset digest `831dfbb423ba40538c187dae4dcd4a50b947ae41e5af9c04e8b1f34d825f5d7f`. All eight fixture receipts contain this exact identity and digest. This label is not a published release. Earlier observations used commits `3fd3207` and `15ef62f`.

All paths below are relative to `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/`:

- Final source archive: `u13-standards-source3/`.
- Final actual export: `u13-standards-export3/`.
- API fixture: `u12-EC3iZO/u12-api/`.
- Inertia fixture: `u12-8Xh8Se/u12-inertia/`.
- Installed Next compositions: `u13-next/{base,app,sanity,sqlite,postgres,max}/`.

The Laravel fixtures were refreshed from the current application templates, preserving their dedicated PHPUnit database configuration. The Next fixtures used the real copy, installer, environment, brief and standards-export functions. These are composition audits, not packed-release generation. No pending production manifest was bypassed or changed. Next installs resolved dependencies for the audit; frozen release-lock verification remains U14 work.

## Changes made

- API Composer metadata now includes the missing description and MIT license.
- Inertia formatting no longer excludes all policy docs, OpenCode assets, shared scripts, guidelines, receipts or Lefthook configuration. Generated Wayfinder/type exclusions remain narrowly scoped.
- Next TypeScript excludes generated coverage and Playwright report directories. Previously, running coverage before building made TypeScript check third-party report JavaScript and fail.
- SQLite extras explicitly reference installed Bun types. TypeScript 7 otherwise failed to resolve `bun:sqlite` despite `@types/bun` being installed.
- The base environment schema uses Zod's top-level URL validator, including the CLI-generated version.
- Generated shell configuration has a test for resolved identity, valid locale and safe unique local navigation. The class-merging extra tests conditional classes and utility conflict resolution.
- Vitest excludes the separate `e2e/` runner. Previously the maximal composition loaded a Playwright spec inside Vitest and failed before coverage completed.
- Generator tests cover Composer metadata, Bun declarations, the URL validator and the absence of broad Inertia format exemptions.
- Internal Next anchors now use framework links. Internationalized shells use the locale-aware navigation module. Contact submission uses a synchronous ref guard, releases it after failure and prevents resubmission after success.
- Selected Sanity/database/UI/i18n integration modules have exact positive Knip entry points. React Doctor still scans their implementations. No files or rules are ignored.
- Dependency maps remain lexically sorted after extra composition, matching installed oxfmt. Drizzle generation formats its metadata so migration followed by root checks remains green.
- The Inertia cache test clears dotenv's loaded-key marker, changes all environment adapters and restores their exact prior state. Its enabled-cache and disabled-config assertions remain intact.
- Turnstile token ownership stays with the parent submit/reset events and widget expiry/removal callbacks. The redundant parent callback in the effect was removed.
- Template-owned design history, docs and extras were formatted. The API contracts were regenerated through the new formatter-aware standards script.
- Setup now explicitly runs `boost:install --guidelines --skills --no-interaction` in the PHP root, then the root skill-sync script. Frozen Composer installs do not run `post-update-cmd`. Inertia seeds its actual `funnysoft-quality` skill so a first `boost:update` also enables skill installation. Failures at either Boost step are redacted and resumable in the generator tests.

## Inventory and results

| Scope                     | Result                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generator `bun run check` | Pass, including the new setup-failure and composition regressions. Existing opt-in live skips remain. Lint, formatting and TypeScript pass.                                                                                     |
| All six Next compositions | Full root `bun run check` passes. Production builds pass. Authored-library line coverage is 100%; React Doctor has zero warnings. SQLite generation/migration and PostgreSQL generation also pass followed by full root checks. |
| Next PHP/Boost omission   | Zero PHP files, Composer manifests or Boost assets outside installed/build output in all six cases. OpenCode has only the Mobbin MCP server. All briefs explicitly activate policy reading.                                     |
| API PHP root check        | Pint, PHPStan max, Rector, 106 Pest tests with 913 assertions, 100% named line coverage and 100% type coverage pass against the current export.                                                                                 |
| API frontend              | Final full root check passes, including formatting, typecheck, 127 Vitest tests with 100% named library line coverage, zero-warning React Doctor, fresh schema and 13 workflow tags. Prior production build passes.             |
| Inertia frontend          | Final full root check passes after real Boost installation and sync, including formatting, Wayfinder, TypeScript, 18 Vitest tests at 100% library line coverage and zero-warning React Doctor. Prior production build passes.   |
| Inertia PHP               | Pint, PHPStan, Rector, 100 Pest tests with 889 assertions and 100% named line/type coverage pass. The cache regression passes with 18 assertions.                                                                               |
| API fresh schema          | Root `bun run check:schema` passes with registration enabled and isolated cache paths from the actual export.                                                                                                                   |
| API workflows             | Root `bun run check:workflows` passes: 13 registered jobs have Playwright tags.                                                                                                                                                 |
| Boost                     | Real installation and sync pass in both layouts. Root policy-entry briefs survive, with 15 API and 18 Inertia root skills and zero symlinks. Full checks pass over the resulting assets.                                        |
| OpenCode                  | Actual stamped config uses V2 `mcp.servers`; the API command is `php services/api/artisan boost:mcp`. The brief activates rules because `instructions` alone is inactive in V2.                                                 |
| Architecture              | Existing suites distinguish product settings actions from Fortify authentication adapters. API product actions enforce `execute`, final/readonly classes and repository persistence. No generic action layer was introduced.    |

## Resolved blockers

### Standards-owned Boost sync and formatting

The coordinator's `15ef62f` fixed stamped-asset, receipt and schema-format failures. Commit `a6166be` then fixed both real-install Boost issues:

1. Inertia's generated and destination skill directories coincide. The synchronizer now accepts this source and stages it before replacing destination files.
2. Boost's upstream Markdown, briefs and metadata are normalized using the installed stack formatter. Staged validation occurs before original replacements.

Real Boost installation followed by synchronization now exits 0 in both fixtures. Both root policy-entry briefs survive. API has 15 root skills and Inertia has 18, with zero symlinks in either tree. Final evidence is in `u13-{api,inertia}-final-boost.log`. The standards checkout was not modified by this worker.

The coordinator reviewed and authorized formatting of `template/stacks/api-next/packages/design-system/mocks/account/U11-REVIEW.md`. It now passes oxfmt. All authored facts remain, including the detached browser relaunch note and target ID `54B58892C77B4377FC0EC9989ABCBBC2`. Root `lefthook.yml` remains untouched.

### Resolved service configuration failures

Sanitized inspection identified `RedisException: Connection refused` behind the API 500s. The isolated transport process does not inherit application `.env`; it fell back to Redis port 6138 while this machine listens on 6379. `REDIS_PORT=6379` resolves those failures. The remaining browser failure was a missing downloaded Playwright executable, resolved with the already installed Chrome path. No security middleware or service checks were disabled, and no Redis flush or broad cache clear was run.

### Composer strict validation

The coordinator approved `composer validate --strict --no-check-all`. It passes in both installed PHP roots with lock validation enabled. `--no-check-all` disables the overstrict/loose constraint heuristic; it does not disable manifest or lock validation. Deliberate Fortify 1.39.0, Nightwatch 1.30.0 and Resend 1.13.0 pins remain exact and have regression assertions. A disposable validation fixture proves the approved command returns 0 for the real manifest, 2 after removing its description and 2 after changing Fortify without updating the lock. No `--no-check-lock` is used for final proof.

## Browser verification

`dev-browser` drove a dedicated Chrome instance on port 9253. Using the actual Laravel Turnstile components with a controlled widget adapter, both variants cleared spent tokens after submission and disabled submission after expiry. Temporary component fixtures were removed afterward.

The built Next home retained a document marker after clicking its internal link. The internationalized contact page rejected two synchronous submit events as one request, allowed retry after a controlled 503, and disabled the button after success. The mobile screenshot at `/Users/jonaspauleta/.dev-browser/tmp/u13-contact-mobile.png` was inspected at 390 by 844: no overflow, readable labels and visible success feedback. Browser fixtures used dummy values and intercepted contact delivery. All worker-owned browser/server processes were stopped.

## Evidence commands

Commands were run from the generated repository roots unless stated otherwise:

```sh
bun run check
bun run lint
bun run typecheck
bun run test
bun run doctor
bun run build
bun run check:schema
bun run check:workflows
F7T_CHROMIUM_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' REDIS_PORT=6379 F7T_TRANSPORT_DATABASE=u12-api_test bun run check
```

API-specific commands from `services/api`:

```sh
composer validate --strict --no-check-all
php artisan boost:install --guidelines --skills --no-interaction
bash ../../scripts/boost-sync-opencode-skills.sh
```

Final full Laravel checks are `u13-api-complete-check.log` and `u13-inertia-complete-check.log`, both exit 0. Real installation/sync logs are `u13-api-final-boost.log` and `u13-inertia-final-boost.log`, both exit 0. Composer validation was repeated successfully in both PHP roots after synchronization.

Final export-impact lint checks are `u13-next-{base,app,sanity,sqlite,postgres,max}-final-export-lint.log`, all exit 0. Passing prior Next full checks use `-latest-check.log` for base/app and `-passing-check.log` for the four optional compositions. Additional SQLite/PostgreSQL post-generation full checks have dedicated logs. Build evidence remains in `u13-{api,inertia}-final-build.log` and `u13-next-<composition>-final-build.log`.

The whole-generator check was last verified after U11 report normalization: `u13-generator-final-check.log`, 197 passed and 10 existing opt-in skips. This final export-only continuation required no application source changes. The only repository file edited in this continuation is this receipt. Fixture updates consist of the new standards export and actual Boost-generated/synchronized assets. Existing configuration, keys and dedicated databases were preserved.

U14 still owns the actual standards release identity, inventory, lock catalog, frozen packed matrix and release/browser/deployment proofs. No U13 conformance blockers remain; this audit does not establish U14 release readiness.
