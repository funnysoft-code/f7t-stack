# Multi-stack generator verification

The `0.2.0` bundle now pins published standards `v0.3.3` for the PHP coverage correction. Its package proof is under `u14-release-033`. The change enables assertions only for Pest's coverage invocation; application runtime and dependency inputs are unchanged. The prior route/schema failures were missing migrated-database prerequisites, not production defects. Stable local HTTPS acceptance carries forward only for unchanged runtime content. Hosted CI retry and deployed-preview acceptance remain coordinator-owned.

## PHP coverage correction: standards v0.3.3

- Release: https://github.com/funnysoft-code/standards/releases/tag/v0.3.3, merged through PR #6.
- Exact archived commit: `0d955d9297027749f660bae2ca489710f9ffd599`; remote tag independently resolves to it. GitHub confirms a published, non-draft, non-prerelease release. The coordinator verified its tree against reviewed `2e31e8795f9af4aaa27a52f03050c90f498935a8`.
- Independently verified export digest: `62d9b0e0b8055d0fc9c52f25d02872faf1a65ec7e5f962163cb9fe96bf0f79be`.
- Generator and template revision remain `0.2.0`. The full regenerated asset inventory matches the refreshed manifest; standards verification passes independently before import.
- Artifact root `$R`: `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-033`.

Archive `$R/packed/create-f7t-app-0.2.0.tgz`:

```text
SHA-256 b09b807a7eb9249ad1e346018afada4403a2d8eb9caa017111b3e014deab21df
```

Local proof passes: **962 package files**, **194 outputs**, all three negative probes, **405 root tests / 7 opt-in skips**, and all **49 archived standards gate assertions**. Node **22.23.2** and Bun **1.4.0** were supplied by the existing isolated toolchain. The matrix records **zero new installs**. Counts remain **837 template assets, 120 standards files, 66 lock keys, 68 lock files and 34 fingerprints**.

All 962 files match the newly extracted archive byte-for-byte. All **359 recorded HTTPS runtime hashes** match both current source and that archive, bound to runtime-manifest SHA-256 `a5d937bc448fbb7483949c36f4a7abfcabcc9524817182da514239f8fa20912f`. `parity.json` records the comparison and the fresh generated PHP gate hashes: Inertia `c6257560592d8654ce2322c440894fb273c1af37272ed1d39c563de322fab251`, API `189889c90731b018f2173396eaebf5f8184c7d3b4ea1e2bd89fe1638d1653a74`. Both equal the retained corrected template with `__PHP_ROOT__` substituted; no running fixture was modified.

Commands after exact archive export and full inventory equality:

```sh
# PATH begins with the existing u14-release-031/toolchain.
bun run verify:release
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
bun run verify:matrix --output "$R/packed"
# From $R, using an already installed Playwright package without reinstalling:
node standards-source/tests/gates_test.mjs /private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-032/doctor/api/node_modules/@playwright/test
```

Receipts/logs: `packed/matrix.json`, `packed.log`, `check.log`, `standards-gates.log`, `delta.json`, `parity.json`. The matrix enables neither fixture mode nor installation. The coordinator's dedicated Redis service on port 6149 was left untouched.

### Exact change and coverage evidence

Only nine of 962 package files differ from v0.3.2 archive `1d2354d69ec306bc1477274ffcf27eede67bb4886afbbb6527e808f8ac04209f`: README, template provenance, both integrity manifests, three playbook quality documents and the two Laravel PHP quality scripts. The remaining **953 files and all executable modes are identical**. CLI, application templates, setup/configuration files and every dependency/lock input remain unchanged. `delta.json` records exact before/after hashes and full catalog equality.

The sole PHP command change adds `-d zend.assertions=1` to the Pest coverage invocation. It does not change production INI or the separate type-coverage invocation. This keeps assertion lines executable for coverage even when the host's production INI disables them.

Retained real production-INI logs at `coverage-debug-0334976` show the same passing test counts before and after: Inertia **115 / 968 assertions**, API **117 / 967 assertions**. Original coverage gates failed at **96.0% / 96.1%**. Corrected full PHP gates pass **100% line and type coverage** in both layouts. These are the root's retained real-suite runs, not fresh suite executions by the package worker. The debug fixture scripts were restored afterward; parity uses the retained corrected `standards-tracked/templates/scripts/php-gate.sh` with the appropriate PHP root substituted.

### Hosted CI stage

[Run 34299590161](https://github.com/funnysoft-code/f7t-stack/actions/runs/34299590161), head `0334976b51d3d04e71f87ffe6f6b0d8c577983a3`, passed root check, the full packed/frozen matrix and all six Next generated gates. Only the two Laravel generated jobs failed. The coordinator traced them to coverage under production INI. Job conclusions were independently verified with `gh run view`; the v0.3.3 retry remains pending root's commit/push.

The existing 66-key frozen-install proof transfers through identical catalog and dependency bytes. This refresh does not repeat installs, Next Doctor/build checks or live HTTPS journeys. No deployment, global PHP setting or Redis lifecycle change was performed.

## CI round two: standards v0.3.2

- Release: https://github.com/funnysoft-code/standards/releases/tag/v0.3.2, merged through standards PR #5.
- Exact `git archive` source: `eeb9a77bb3fcc9e7100a0d87518f2966deeaf911`. Remote tag resolution was independently checked. The coordinator verified the merged tree against reviewed `dd56247`.
- Independently verified export digest: `a2d300f3daf9b14e764f7e815afd07253a1b07446e8ec45a928a866fcf9f697a`.
- Generator and template revision remain `0.2.0`. The existing complete lock catalog was preserved without re-resolution. Full `inventory()` equality and independent release verification pass.
- New artifact root: `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-032`.
- Archive: `packed/create-f7t-app-0.2.0.tgz`.

```text
SHA-256 1d2354d69ec306bc1477274ffcf27eede67bb4886afbbb6527e808f8ac04209f
```

### Verified changes and parity

Against accepted archive `a8076d66f6eb4d6c82144724e703da5afad03a186c1516cabf4961724de05605`, **953 of 962 files are byte-identical**, with unchanged executable modes. The nine changed files are the root README, template provenance, generator manifest, standards manifest, two exported `deploy-vercel.yml` workflows and three exported playbook `quality.md` documents. `delta.json` records their exact old/new hashes. CLI and application templates, setup code, tests, all dependency manifests and all lock files remain byte-identical.

The Vercel workflow now exposes `VERCEL_TOKEN` only to project-settings pull and deploy/promote steps. Installation and build do not inherit it from job environment. This is verified exported workflow behavior; no deployment was executed. The generator's root CI Boost/local and SQLite-file corrections and `cli/src/github-actions.test.ts` remained coordinator-owned and were not edited by this worker.

The runtime hash manifest retained by the HTTPS worker has SHA-256 `a5d937bc448fbb7483949c36f4a7abfcabcc9524817182da514239f8fa20912f`. All **359 entries match both current source and the v0.3.2 archive**. `runtime-parity.json` records this comparison. It does not claim a new browser run, changed deployment-workflow acceptance on a provider, or new Cloud proxy-address verification.

All **962 package paths are tracked**, including the 46 standards assets retained by `aaf75f0`. This path check is not a committed Git-only snapshot test; the coordinator still owns that final verification after committing this refresh.

### Checks and install-proof transfer

| Check                                           | Result                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Production release verification                 | 962 files pass, 837 template assets, 120 standards files                   |
| Production generation matrix                    | 194 outputs and all three negative probes pass; no fixture mode            |
| New full-matrix installs                        | Zero; unchanged 66-key catalog and 34 dependency fingerprints              |
| Root checks with published-export tests enabled | 405 passed, 7 opt-in skips; lint, formatting and types pass                |
| Real React Doctor 0.9.12                        | Pass on site, app, Sanity, SQLite, PostgreSQL, maximal Next and API + Next |
| Archived v0.3.2 standards gate fixtures         | All 47 assertions pass                                                     |
| Current source versus new extracted archive     | All 962 files match byte-for-byte                                          |

Doctor ran on seven new generated directories under `doctor/`, each with a targeted frozen JavaScript install and the actual new exported gate. `env -u VERCEL_TOKEN` kept deployment credentials absent without reading their values. These seven prerequisite installs are not a rerun of the 66-key release install matrix; no new Composer installs were required. Node **22.23.2** and Bun **1.4.0** came from the existing isolated `u14-release-031/toolchain`.

Hosted run [34297024838](https://github.com/funnysoft-code/f7t-stack/actions/runs/34297024838), head `aaf75f0b10ee4e80173504fce5cce7767d1b417b`, has successful `check` and `packed-matrix` jobs. Job conclusions were independently read with `gh run view`. Its generated-gate jobs failed before the reviewed CI/standards corrections. The successful hosted frozen-install proof and prior local 66-key receipt remain applicable to the identical lock/dependency inputs; the new hosted generated-gate run is still pending root's push/retry.

Commands from the generator root, with the isolated toolchain prepended to PATH:

```sh
# Export exact archived standards commit, independently verify, copy its export,
# and refresh the provenance hash using inventory("template").
bun run verify:release
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
bun run verify:matrix --output "$R/packed"
# In each of seven fresh generated Doctor directories, with VERCEL_TOKEN unset:
bun install --frozen-lockfile
bash scripts/frontend-gate.sh doctor
# From the external artifact root:
node standards-source/tests/gates_test.mjs "$R/doctor/api/node_modules/@playwright/test"
```

Receipts and logs under `$R`: `packed/matrix.json`, `packed.log`, `check.log`, `doctor.log`, `standards-gates.log`, `delta.json`, `runtime-parity.json`. No runtime fixtures or shared data were changed. No application, source CI workflow or CI-test files were edited by the package worker.

## Accepted test-only package refresh

Commit `7168210` follows package commit `abbf4bc`. The existing `inventory()` machinery regenerated the complete template inventory; exactly three test hashes changed. The refreshed manifest was checked against the full regenerated inventory and passed the independent release verifier. No lock or standards regeneration was necessary.

The exact delta from archive `a52c1dee34680c80ed9ee9c535717667ba7522f067931dea1dd899254906921c` is:

- `template/stacks/api-next/services/api/tests/Feature/TrustedProxyTest.php`
- `template/stacks/inertia-monolith/tests/Feature/TrustedProxyTest.php`
- `template/stacks/inertia-monolith/tests/Http/Users/AccountPagesTest.php`
- `template/manifest.json`, only the three corresponding asset SHA-256 values.

Of **962 package files, 958 are literally byte-identical**. Excluding the three test files leaves 959 files: 958 unchanged files plus the changed integrity manifest. Executable modes are unchanged. Deep comparison of the manifests after substituting those three hashes proves all remaining metadata identical, including standards identity, dependency fingerprints and the complete lock catalog.

The previous Node **22.23.2** / Bun **1.4.0** receipt at `u14-release-031-final/packed/matrix.json` remains the **66-key frozen-install proof**. This minimal refresh performs **zero new frozen installs** and makes no new full-runtime claim. All executable/application bytes and dependency inputs are unchanged, so the prior runtime and installation evidence applies to this package's unchanged runtime contents. The three corrected test files have separate reviewed evidence.

Commands use `PATH` prefixed with `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031/toolchain`:

```sh
# After applying the three hashes returned by inventory("template"):
bun -e 'import assert from "node:assert/strict"; import {inventory} from "./cli/src/release-candidate.ts"; import {verifyReleaseBundle} from "./cli/src/standards.ts"; assert.deepEqual(verifyReleaseBundle().assets, await inventory("template"));'
bun run verify:release
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
bun run verify:matrix --output /private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-accepted
```

The last command intentionally omits both `--install` and `--fixture-mode`. Root checks pass **401 tests, 7 opt-in skips**, with lint, formatting and types clean. External sibling logs are `u14-accepted-check.log` and `u14-accepted-matrix.log`. `u14-accepted-delta.json` records exact old/new SHA-256 values for the four changed files, unchanged metadata assertions and the prior frozen-install receipt location. The reviewed test hashes in `docs/reviews/u14-proxy-tests-rereview-ses-f7c835d0/identity.json` match this delta.

The accepted production generation run passes **194 outputs and all three negative probes**, with **zero new installs** recorded in `u14-release-031-accepted/matrix.json`. All **962 source files match the newly extracted package byte-for-byte**. The new archive is `u14-release-031-accepted/create-f7t-app-0.2.0.tgz`:

```text
SHA-256 a8076d66f6eb4d6c82144724e703da5afad03a186c1516cabf4961724de05605
```

Standards remains `v0.3.1`, commit `13889e25ab3df8a06307156722dc08377183b356`, export digest `9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42`. Counts remain **837 assets, 120 standards files, 66 selection keys, 68 lock files and 34 fingerprints**. The existing installed `u14-release-031-final/packed/fixture-192` and `fixture-193` were not modified by this refresh. Their unchanged runtime is tied to the accepted package by the exact delta receipt, not by a claim of fresh runtime execution.

Formal review: [proxy-test rereview](../reviews/u14-proxy-tests-rereview-ses-f7c835d0/review.json), no findings. Its retained evidence records **115 Inertia PHP tests / 968 assertions**, **117 API PHP tests / 967 assertions**, and configured coverage/type coverage of **100%**. These are the bounded worker's fixture runs, not new runs by this package worker. Environment override tests cover all Laravel adapters and dotenv reloads; `withoutVite` removes only the asset-rendering prerequisite from the real HTML cache assertion.

### Corrected route/schema diagnosis

[Route/schema verification](u14-route-schema-check.md) establishes the causal chain: missing PostgreSQL schema makes Wayfinder fall back to the vendor model's numeric-ID docblock. A migrated database exposes the UUID column, regenerates a string route argument and passes typecheck. API schema check mode also passes against migrated PostgreSQL with both snapshots unchanged. My earlier classification of the Inertia failure as a source-contract defect was incorrect. No route, DTO or production code change was needed. The later three-test correction closes the separate proxy environment/build-prerequisite failures recorded in that earlier report.

## Prior combined-source installation and runtime proof

Source baseline: `e87f4be`, including `e405b6c`, `d340a33` and `ea1f53c`. The coordinator confirmed both latest formal reviews clear before this preparation. No application source file was changed by the package worker.

The published standards identity remains `v0.3.1`, commit `13889e25ab3df8a06307156722dc08377183b356`, independently verified export digest `9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42`. Generator and template revision remain `0.2.0`.

Artifact root `$R`: `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-final`. The previous `u14-release-031/toolchain` supplies native Node **22.23.2** and Bun **1.4.0**. The preserved exact export at `u14-release-031/standards-export` was independently verified again during preparation.

`prepare:release`, `build` and `verify:release` pass. The package contains **962 files**, **837 template assets**, **120 standards files**, **66 selection keys**, **68 locks** and **34 distinct fingerprints**. All catalog entries and dependency fingerprints are identical to the intermediate 031 bundle. Seven new assets account for the inventory increase: two SafeForm components, two proxy configurations, two proxy regression suites and Inertia's response-cache middleware.

The complete production matrix exits **0**: **194 generated outputs, all 66 frozen installations**, both locked Composer installs and all three failure probes. The actual Node 22/Bun 1.4.0 archive is `$R/packed/create-f7t-app-0.2.0.tgz`:

```text
SHA-256 a52c1dee34680c80ed9ee9c535717667ba7522f067931dea1dd899254906921c
```

`packed/matrix.json` and `packed.log` record the result. All **962 package files matched the extracted archive byte-for-byte** at that run's completion. `combined-fix-assets.json` also records source/fixture SHA-256 equality for nine schema and security-fix assets. The subsequent test-only delta is documented above.

Fresh full-matrix roots for the coordinator's next HTTPS run are `$R/packed/fixture-192` for Inertia and `$R/packed/fixture-193` for API + Next. They contain locked dependencies and generated environment examples, not completed live setup. Any source correction after this receipt requires refreshed inventory and affected package proof before calling them final.

Fresh packed browser evidence: API **32 tests pass**, Inertia **13 tests pass**, including native form-submission prevention before hydration. Both builds pass. Fresh environments derive from the generated examples; Inertia uses its own generated application key, array cache/session and synchronous queue for stubbed browser tests. No old application environment was copied.

Generator checks pass **401 tests with 7 opt-in skips**, including the exact published-export composition tests. API lint, typecheck, doctor and workflow collection pass; its database-independent Vitest run passes **114 tests** with `tests/integration/**` excluded. Inertia lint, doctor and the full frontend test gate pass. Both PHP roots pass Pint, Rector and PHPStan at the generated gate settings. Real Boost install and sync ran before these gates.

Commands from the generator root:

```sh
OLD=/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031
R=/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-final
export PATH="$OLD/toolchain:$PATH"
bun run prepare:release --output "$R/prepared" \
  --standards-export "$OLD/standards-export" \
  --digest 9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42 \
  --template-revision 0.2.0 --standards-release v0.3.1 \
  --standards-commit 13889e25ab3df8a06307156722dc08377183b356
# Integrate verified prepared standards, locks and manifest into template/.
bun run build
bun run verify:release
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
bun run verify:matrix --output "$R/packed" --install
```

Separate `verify:matrix --stack api-next --install` and `--stack inertia-monolith --install` runs created `$R/api-gates/fixture-0` and `$R/inertia-gates/fixture-0` for builds and browser/static gates. They use the same source package; no fixture mode is enabled. Browser commands use `CI=1` and `PLAYWRIGHT_BROWSERS_PATH="$OLD/browsers"`. Gate logs are `api-gates.log`, `api-php.log`, `api-unit.log`, `inertia-gates.log`, `inertia-remaining.log`, `api-e2e.log`, `inertia-e2e.log`, `inertia-build.log` and `check.log`. Failure details are in `inertia-typecheck.log` and `api-schema.log`.

### Historical gate failures, subsequently resolved

- Inertia `bun run typecheck` initially emitted a numeric passkey argument and failed at `resources/js/pages/settings/passkeys.tsx:101`. Migrating the dedicated database resolved Wayfinder's fallback inference and typecheck passed without source changes.
- API `check:schema` initially failed because PostgreSQL database `fixture-0` did not exist. The coordinator's isolated migrated-database run subsequently passed fresh schema comparison without rewriting either snapshot.

The previous root-targeted PHP/HTTPS evidence remains in `u14-proxy-cache-fix.md`; it does not replace a fresh package-level database-backed run. The license confirmation remains coordinator-owned in `dependency-entitlements.md`.

The final 962-file npm inventory contains no `vendor/`, `node_modules/`, Composer `auth.json` or runtime `.env` paths. Paid dependency source is installed only in external fixtures. The owner's Solo declaration and repository secret metadata do not establish downstream licensing rights or coverage of the pinned version's update period; the outstanding entitlement questions remain in the coordinator's report.

### Environment guidance review

The root README states production provider connections remain manual. Both generated READMEs document manual Cloud provisioning and explicit proxy peer configuration. `TRUSTED_PROXIES` defaults to empty, accepts only actual peer IPv4/IPv6 addresses and trusts only the forwarded scheme. Loopback examples describe local Herd, not verified Laravel Cloud proxy addresses. No Cloud proxy address or deployment behavior is claimed verified by this package run.

## Intermediate formal-review refresh: standards v0.3.1

This section supersedes the v0.3.0 package evidence below, but does not cover the subsequent HTTPS findings. Generator and template versions remain `0.2.0`. Preserve all `u14-release-031` receipts and fixtures as tested. Resume preparation into a new external directory only after the coordinator confirms the source fixes are reviewed. The coordinator's license confirmation is recorded separately in `docs/verification/dependency-entitlements.md`.

- Standards PR: https://github.com/funnysoft-code/standards/pull/4.
- Release: https://github.com/funnysoft-code/standards/releases/tag/v0.3.1.
- Exact archived commit: `13889e25ab3df8a06307156722dc08377183b356`. `git ls-remote` independently confirms the release tag points to this commit; the coordinator verified its tree against reviewed `1c2dfbf`.
- Independently verified export digest: `9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42`.
- New external artifact root: `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031/`. Earlier fixtures and the HTTPS worker's report are not inputs to this refresh.
- Runtime: isolated Bun **1.4.0** and native Node **22.23.2** for the entire production matrix, rather than a separate Node compatibility-only run.
- Fresh inventory: **955 npm package files**, **830 template assets**, **120 standards files**, **66 selection keys**, **68 lock files**. The three added assets are both `e2e/settings-requests.spec.ts` files and Inertia's `app/Http/Controllers/Users/PasswordResetLinkController.php`.
- The package includes backend fix `ea1f53c` and security UI fix `d340a33`, the four reviewed passkey/recovery screens and both new regression specs, copied without editing their source files. The coordinator committed the UI slice during verification.
- All dependency-manifest fingerprints match the prior catalog. Re-resolution changes one Sanity-only Bun lock: top-level `safe-buffer` 5.2.1 with nested 5.1.2 entries. Other 65 catalog entries remain identical; Composer locks are unchanged.
- Corrected standards workflows create the Next `.env` from its tracked example and install Chromium before API `test` as well as `e2e`. Generator CI now also copies the Next environment and names its pre-gate Chromium installation explicitly.

Commands, with `$R` set to the external artifact root and `PATH="$R/toolchain:$PATH"`:

```sh
bun run prepare:release --output "$R/prepared" \
  --standards-export "$R/standards-export" \
  --digest 9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42 \
  --template-revision 0.2.0 --standards-release v0.3.1 \
  --standards-commit 13889e25ab3df8a06307156722dc08377183b356
bun run build
bun run verify:release
bun run verify:matrix --output "$R/packed" --install
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
```

Fresh checks: generator **401 tests pass, 7 opt-in skips**, including published-export tests; root lint, formatting and types pass. API's clean packed Chromium e2e run passes **26 tests**, including the new passkey/recovery request regressions. Next's clean generated fixture builds and passes its e2e gate after copying `.env.example`. Browser binaries were installed only beneath `$R/browsers`.

Inertia's clean packed build and **10 Chromium e2e tests pass**, including both new request-race cases and recovery-code clearing. Its first web-server attempt timed out with a missing application key; generating a fresh fixture-only key in `.env` and selecting array sessions/cache plus a synchronous queue resolved startup. The passing run used `CI=1`, so it did not reuse an existing server. The API workflow collector also passes with **13 registered tags**.

Browser fixture roots: `$R/api-e2e/fixture-0`, `$R/inertia-e2e/fixture-0`, and `$R/next-e2e`. Logs: `check.log`, `api-e2e.log`, `inertia-build.log`, `inertia-e2e-final.log`, `next-build.log`, `next-e2e.log`, and `api-workflows.log`. All environment files derive from the newly generated tracked examples; no old application environment was copied.

`review-fix-assets.json` records SHA-256 equality between source and fresh packed fixtures for the OpenAPI JSON, generated TypeScript schema, new reset controller and both regression specs.

The full production matrix passed on Node **22.23.2** and Bun **1.4.0**: **194 generated outputs, all 66 frozen-install keys**, both locked Composer installs, and all three failure probes. `packed/matrix.json` and `packed.log` record this run. The production archive is `packed/create-f7t-app-0.2.0.tgz`:

```text
SHA-256 3531ae4875f620534be4efdd3e70903c58bfe7427f8bb484434d30220bfc7b84
```

Intermediate full-matrix Laravel roots are `$R/packed/fixture-192` for Inertia and `$R/packed/fixture-193` for API + Next. They have frozen dependencies and locked Composer packages but do not include the subsequent HTTPS fixes. The browser-only fixtures above remain separate. At completion of this intermediate run, all 955 package files matched the tested archive byte-for-byte, including the coordinator's committed UI fixes. That comparison does not cover subsequent source edits.

The exact archived standards `tests/gates_test.mjs` passes **47 assertions** when given the absolute path to the fresh fixture's installed Playwright package. This includes clean-checkout browser prerequisites and e2e tag containment. Evidence: `standards-gates-final.log`. The first invocation supplied a relative Playwright path and failed only its subprocess resolution; the corrected absolute-path invocation passes. No standards working-tree file was changed.

An additional full API `bun run test` attempt failed in the real PHP transport fixture setup (`Transport fixture PHP operation failed`, details intentionally withheld). This check requires provisioned PostgreSQL/Redis transport infrastructure and is not claimed as passing here; the corrected Chromium prerequisite alone does not satisfy that infrastructure requirement. Final Blacksmith transport tests remain a coordinator gate. No credentials were retrieved for this attempt.

## Historical v0.3.0 production proof

### Published standards and generator identity

- Standards PR: https://github.com/funnysoft-code/standards/pull/3, merged at `ad1eb5249ad747aee34dd8794c2e91ff262a7cd6`.
- Published release: https://github.com/funnysoft-code/standards/releases/tag/v0.3.0. The coordinator verified its tag points to that merge commit and its tree matches the reviewed `3c1b4fd8318a34db44b487a600b7b89d778e7859` tree.
- Export source: `git archive ad1eb5249ad747aee34dd8794c2e91ff262a7cd6`, independently extracted outside the standards checkout.
- Independently verified export digest: `4d528586991c72a6f120bf92533365e73fbeeb6ef336ce273bb2a72a0a81415a`.
- Generator version and template revision: `0.2.0`. Version identity avoids inventing an unknown future commit. Every template byte is bound by the asset inventory.
- Source `template/manifest.json` now has the real standards pin, complete template inventory and all 66 lock keys. The historical U15 compatibility note was removed.

### Published-export checks

Artifacts are beneath the same temporary root listed below, in `u14-release-030/`. An isolated downloaded Bun **1.4.0** executable is used for release preparation, generated frozen installs and the new workflow gate; no global tool version or setting was changed. Native Node is **26.8.1**, Composer is **2.10.2**, and PHP is **8.5.8**. CI explicitly selects Node 22 and Bun 1.4.0.

The production commands use no fixture option:

```sh
bun run prepare:release --output "$TMP/u14-release-030/prepared" \
  --standards-export "$TMP/u14-release-030/standards-export" \
  --digest 4d528586991c72a6f120bf92533365e73fbeeb6ef336ce273bb2a72a0a81415a \
  --template-revision 0.2.0 --standards-release v0.3.0 \
  --standards-commit ad1eb5249ad747aee34dd8794c2e91ff262a7cd6
bun run build
bun run verify:release
bun run verify:matrix --output "$TMP/u14-release-030/packed-node" --install
F7T_STANDARDS_FIXTURE_SOURCE=/Users/jonaspauleta/Code/funnysoft/standards bun run check
```

For these commands, `PATH` begins with `$TMP/u14-release-030/toolchain/bun-darwin-aarch64`; `bun --version` returns `1.4.0`. The optional standards composition test archives the fixed published commit and deletes that source before applying its export. Production generation uses only the bundled export. An isolated frozen install of the generator's own 0.2.0 manifest also passes on Bun 1.4.0 without changing the root `bun.lock`; the lock has no root-version field to update.

- `prepare:release` built `prepared/bundle` without fixture mode against the expected published release, commit and digest.
- `bun run build` and `bun run verify:release` pass against the integrated source bundle, with 952 package files.
- A separate production packed API fixture at `packed-api-tags/fixture-0` passed frozen Bun and authorized locked Composer installation.
- The actual exported `check:workflows` invokes Playwright `test --list --reporter=json e2e/` and passes with **13 registered workflow tags**. Adding a registered tag present only in a comment produced exit 1, `missing Playwright tag @u14-comment-probe`. The probe was removed and the registry restored.
- Real Boost install and synchronization pass in both `packed-api-tags/fixture-0` and `packed-inertia-boost/fixture-0`, with their authored policy-entry briefs preserved.
- The new bundle includes the standards fixes for Laravel Cloud `commit_hash`, pinned Vercel prebuilt deployment, Playwright collection and e2e path containment. These are bundled policy assets, not fresh deployment evidence.

### Production matrix result

The complete native-Node production run exited **0**, without fixture mode, explicitly launching Node **26.8.1** for generation and using Bun **1.4.0** for all JavaScript installations:

| Proof                     | Result                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Actual npm inventory      | 952 files, including 827 inventoried template assets and 120 independently verified standards-export files                          |
| Composition catalog       | 66 selection keys, 68 lock files, 34 distinct dependency-manifest fingerprints                                                      |
| Packed outputs            | 194 generated successfully                                                                                                          |
| Frozen installations      | All 66 keys passed; both Laravel outputs passed authorized Composer installation and strict lock validation                         |
| Negative probes           | Omitted font asset, altered standards digest and incompatible dependency fingerprint each returned exit 1 with an incomplete result |
| Current source comparison | All 952 package files exactly match the production-tested extracted archive                                                         |
| Generator checks          | 401 tests passed, 7 opt-in tests skipped; published-export composition tests enabled, lint/format/TypeScript clean                  |
| Affected generated lint   | API and Inertia lint pass after real Boost installation and synchronization                                                         |

Production archive: `u14-release-030/packed-node/create-f7t-app-0.2.0.tgz`.

```text
SHA-256 e262d1eab8b9fd4db0776f5ba5dac492525b3e7a5198bc0d7f434c65412f27ab
```

Receipts and logs: `u14-release-030/packed-node/matrix.json`, `packed-node.log`, `check-native.log`, `api-lint.log`, and `inertia-lint.log`. The full-matrix installed Laravel roots are `packed-node/fixture-192` for Inertia and `packed-node/fixture-193` for API + Next. They have distinct external directories and have not been used for shared database or Redis mutations. The earlier `packed/` run remains supplemental evidence; it used Bun's `process.execPath` to launch the CLI. The runner was corrected to invoke `node` explicitly, then the entire 194-output / 66-install matrix was rerun successfully with the same archive hash.

The supported minimum Node major was also checked locally with an isolated **Node 22.23.2** executable. `packed-node22/matrix.json` records all **194 generation cases and three negative probes passing** against the identical archive hash. This compatibility run did not repeat installation; the 66-key frozen-install proof uses Bun 1.4.0 above. The actual 13-tag Playwright collection gate also passes with Node 22.23.2 and Bun 1.4.0. Node was installed only under `u14-release-030/node22`, with that directory prepended to PATH for these commands. Ubuntu ARM execution remains the CI gate.

The production locks retain Next 16.3.3, React 19.2.8, Sanity 5.31.2, Drizzle ORM 0.45.2, next-intl 4.14.1, and Resend JS 6.24.0. Inertia retains React 19.2.4, Inertia React 3.7.0 and Vite Plus 0.3.1. Both Laravel variants retain their original Composer locks, including Laravel 13.31.0, Fortify 1.39.0 and Laravel Passkeys 0.2.1; API retains Scramble Pro 0.9.15. Complete transitive versions are in the bundled catalog.

Observed red checks during finalization: the old verifier rejected a template revision equal to the release version; the new regression test passed after allowing only an exact generator-version match or a full commit. The old pending-release test assumed the real source manifest would remain pending forever; it now supplies an explicit pending fixture and continues to prove skip-install cannot bypass that state. Published-identity mismatch has its own rejection test. No production pending-state check was disabled.

## Historical audit identity

The candidate evidence in the next sections predates standards publication. Its pending-manifest observations describe that earlier state and do not replace the production proof above.

- Generator baseline: `3821c1ceb8c7fd835592816e847a2af48c9cfd54`, U13 committed. U14 tooling and notice changes are uncommitted coordinator-owned work at the time of preparation.
- Tested standards commit: `a6166be824aa59a00f5b49bdaf0544bc935d9e0f`.
- Audit-only export label: `v0.0.0-u13-audit`, **not published**.
- Export SHA-256: `831dfbb423ba40538c187dae4dcd4a50b947ae41e5af9c04e8b1f34d825f5d7f`.
- At that point the source manifest still contained its historical U15 compatibility note. Neither that note nor this audit label was a final pin.

## Matrix inventory

`cli/src/release-matrix.ts` enumerates the supported configurations and derives keys through `dependencyComposition` in the existing stack registry.

| Layer                               | Inventory                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Next configurations                 | 192: two shells, four data/database choices, three locale/intl states, and eight shadcn/Playwright/Resend combinations |
| Next selection keys                 | 64: four data/database choices times sixteen shadcn/Playwright/Resend/intl combinations                                |
| Laravel configurations and keys     | `inertia-monolith`, `api-next`                                                                                         |
| Total fast packed outputs           | 194                                                                                                                    |
| Total frozen-install selection keys | 66                                                                                                                     |

Playwright is already a base dev dependency. Its option adds the smoke spec and script, so paired selection keys currently share a dependency graph. The catalog preserves all 64 Next keys rather than removing choices. Shell and the non-intl locale do not affect dependency fingerprints.

The fast Vitest suite checks every Next configuration. Existing config/create-app/prerequisite/setup suites cover both Laravel trees, invalid flags, nonempty targets, missing runners, dependency denial and interrupted setup. The packed runner uses the actual built executable after npm packing and extraction. It verifies every package byte, receipt, dependency digest and copied lock. It frozen-installs each key once, removes disposable Next outputs, and preserves the two Laravel outputs for subsequent service gates.

## Historical candidate commands and artifacts

All local artifact paths below are under:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/
```

Preparation requires an explicit audit/candidate mode and a new external destination:

```sh
bun run prepare:candidate --fixture-mode \
  --output "$TMP/u14-candidate" \
  --standards-export "$TMP/u13-standards-export3" \
  --digest 831dfbb423ba40538c187dae4dcd4a50b947ae41e5af9c04e8b1f34d825f5d7f \
  --template-revision 3821c1ceb8c7fd835592816e847a2af48c9cfd54

bun run verify:matrix --fixture-mode \
  --source "$TMP/u14-candidate/bundle" \
  --output "$TMP/u14-packed" --install
```

Set `TMP` to the directory above. These commands do not read Composer credentials directly. Composer uses its existing authorized configuration. The runner withholds subprocess output and records only commands, paths and outcomes when installation fails.

`candidate.json` contains the audit identity and all keys. `bundle/template/locks/` contains actual Bun locks and the validated existing Composer locks. `bundle/template/manifest.json` inventories those files. The package is private, has a `-u14-candidate` version and refuses publication. `matrix.json` records the archive hash, package-file count, negative probes, generated flags and installed keys. This candidate format deliberately exercises the production release-shaped verifier without modifying the source manifest.

The first packed run generated all 192 Next outputs and frozen-installed all 64 Next keys. It failed on Inertia Composer package discovery because the test runner had not copied `.env.example` first. The application correctly rejected missing production Turnstile credentials. The runner now follows guided setup's environment-before-install ordering. A fresh Inertia packed run then passed locked Bun and Composer installation and strict lock validation.

A separate fresh API packed run also passed Bun frozen installation, authorized Composer installation and `composer validate --strict --no-check-all`. Both Laravel reruns passed all three packed negative probes. These focused receipts are `u14-packed-laravel/matrix.json` and `u14-packed-api/matrix.json`.

The fully installed candidate is `u14-candidate-final/`. Its independently audited npm inventory has **951 files**, including 826 template assets, the separately verified standards export and 66 lock entries. Those entries cover 34 distinct manifest fingerprints: 32 Next graphs and two Laravel graphs.

`u14-packed-final/matrix.json` records a successful **194-output matrix, 66 frozen-installed keys, and all three negative probes**. Both Laravel variants installed from the extracted archive with authorized Composer access and strict lock validation. The archive SHA-256 is `1680b9dd9eace872f2171934f881267a37f9f173da1a2227487723b8696e0dec`. The installed Laravel fixtures are `u14-packed-final/fixture-192` and `u14-packed-final/fixture-193`. The entire command exited 0; log: `u14-packed-final.log`.

A final CLI-license notice review added `template/CLI-NOTICES.txt` and its provenance paragraph. The resulting candidate is `u14-candidate-notices/`. Programmatic comparison confirms its CLI binary and complete 66-entry lock catalog are byte-for-byte identical to the fully installed candidate. The only template changes are `CLI-NOTICES.txt` and `PROVENANCE.md`, so their affected gate is packaging and generation rather than another dependency installation.

That notice-only packed rerun passed all **194 generated outputs and three negative probes**, with **952 npm files**. Receipt: `u14-packed-notices/matrix.json`; log: `u14-packed-notices.log`. Archive SHA-256: `8816dcc943f597ab89f630f383b7c0cfa2c96e9a7050a6d965d28e290eb0f35a`. Source-tree package auditing now reports 764 files. The 66-install proof remains the identical-lock `u14-packed-final` run above.

Generator `bun run check` passed with **396 tests passed, 10 opt-in tests skipped**, plus clean lint, formatting and TypeScript. Final log: `u14-check-final2.log`. `bun run build` and `bun run verify:package` pass. `bun run verify:release` returns exit 1 with the expected pending-bundle message. An actual `bun run verify:matrix --fixture-mode --output <unused-path>` against the source tree also returns exit 1 without creating that path. Workflow YAML parses with Ruby's YAML loader; remote CI execution remains unverified. `F7T_LIVE_CHECK=1` now invokes the complete production packed/frozen matrix rather than only the base/site case.

### Historical candidate versions

Historical preparation used Bun **1.4.2** on macOS ARM64. Its `process.version` returned **26.3.0**, which is Bun's compatibility value, not a native Node measurement. The production runner now invokes `node` explicitly rather than the Bun host's `process.execPath`. Current production verification uses native Node 26.8.1 and Bun 1.4.0, with a separate passing Node 22.23.2 generation and workflow-collection run. Ubuntu ARM execution remains a final Blacksmith gate.

| Scope                 | Locked versions observed                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Next-only             | Next 16.3.3, React 19.2.8, Sanity 5.31.2, Drizzle ORM 0.45.2, next-intl 4.14.1, Resend JS 6.24.0              |
| Inertia               | Inertia React 3.7.0, React 19.2.4, Vite Plus 0.3.1, `@laravel/passkeys` 0.4.0                                 |
| API frontend          | Next 16.3.3, React 19.2.8, `@laravel/passkeys` 0.4.0                                                          |
| Both PHP applications | Laravel 13.31.0, Fortify 1.39.0, Horizon 5.48.3, Nightwatch 1.30.0, Laravel Passkeys 0.2.1, Resend PHP 1.13.0 |
| Permissions           | Inertia 7.4.2; API 8.3.0                                                                                      |
| API schema            | Scramble 0.13.42, Scramble Pro 0.9.15                                                                         |

The complete sanitized dependency versions and integrity data remain in the candidate locks. Both copies of Public Sans hash to `5ed4d31c988e73b258894244f209069ebe77dc7e564861954b21198b6de90d68`; both Space Grotesk files hash to `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d`. The packed runner compares their bytes, not text-decoded representations.

## Failure evidence

- Real npm inventory omission is tested with an existing template file excluded by npm's files list. The audit fails with `Missing packaged asset`.
- Packed negative probes remove a font asset, change the standards digest, and provide an incompatible dependency-manifest fingerprint. Each must return exit 1 with `status: incomplete`; the packed tree is restored afterward.
- Existing standards tests cover tampered executable bytes, modes, malformed paths, symlinks, undeclared assets, duplicate locks and dependency drift before lock writes.
- Candidate preparation rejects missing fixture authorization and output inside the checkout. Both fixture-mode values still reject a pending production manifest.
- The initial expanded matrix incorrectly expected the Playwright dependency to be absent when the option was off. Inspection confirmed the mandatory base dependency; the assertion now checks the optional smoke-test script and retains the mandatory dependency assertion.
- The old README test expected the retired Next-only description. It was updated to cover the three stack invocations, setup recovery and pending-release notice.

## CI

`.github/workflows/ci.yml` uses Blacksmith Ubuntu 24.04 ARM runners with full-SHA-pinned checkout, Bun, PHP and cache actions. Its three stages run generator checks, the actual packed/frozen matrix, then complete generated gates and production builds for six Next representatives and both Laravel stacks. Laravel account Playwright suites use their existing deterministic fixtures. PostgreSQL 17 and Redis 7 services are isolated per job.

Private package access uses the `COMPOSER_AUTH` GitHub secret only on install steps. The cache contains dependency archives, not auth configuration or generated environments. No secret value is embedded in the workflow. The release job verifies the published bundled pin; CI never enables fixture mode. Blacksmith execution and the final release CI are coordinator-owned evidence, not claimed from local configuration inspection.

## Earlier application evidence

[U13 standards conformance](u13-standards-conformance.md) records full generated root gates at the audited standards revision:

- API: 106 PHP tests, 913 assertions, 127 Vitest tests, 100% named PHP line/type and frontend library line coverage, fresh schema and 13 workflow tags.
- Inertia: 100 PHP tests, 889 assertions, 18 Vitest tests, 100% named PHP line/type and frontend library line coverage.
- Six Next representatives: root checks and production builds, plus applicable database generation/migration evidence.

These are earlier installed fixtures. They do not establish the final packed release. U10/U11 recorded local HTTP WebAuthn journeys; stable HTTPS/preview and final packed live journeys remain separate release gates.

## Requirement and acceptance coverage

This table maps the complete contract to its evidence owner. "Earlier application evidence" means the U13 receipt and its referenced unit/browser records, not a fresh U14 packed live journey.

| Requirements | Acceptance / flows    | Evidence and remaining gate                                                                                                                                                                 |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-R3        | AE1, F1               | Full packed matrix, all options and dependency keys, existing Next omission/config tests, published standards pin.                                                                          |
| R4, R14      | AE2, AE7, F2          | Earlier first-user/provisioning and individual account tests. Repeat provisioning and local verification mail from the final packed artifact.                                               |
| R5-R7        | F1                    | Standards PR #3 merged, v0.3.0 published, exact commit exported and independently verified. Copied policy, receipts and digest failures are checked.                                        |
| R8, R18-R21  | AE5, AE11, F1, F2, F5 | Earlier provider/setup/Herd mail evidence, prerequisite and setup failure tests, 66 frozen installs. Final packed guided setup and stable deployment remain required.                       |
| R9-R10, R17  | AE3-AE4, F3           | Default-disabled config checked in both packed trees; earlier backend registration and stale-page browser tests cover enabled/disabled behavior. Repeat final packed live toggle.           |
| R11-R13      | AE5-AE6, AE13, F2-F4  | Earlier password, verification, settings, cross-session and deletion tests/browser records. Final packed live lifecycle remains required.                                                   |
| R15-R16      | AE8-AE10, F4          | Earlier TOTP, recovery and WebAuthn local HTTP journeys. Final packed full ceremony and stable HTTPS/preview proof remain required.                                                         |
| R22-R24      | AE1, AE12, F1         | Noninteractive packed generation, stack roots, standards receipts, existing dirty-schema failure tests and earlier full contract gates. Final CI runs the actual generated schema chain.    |
| R25          | AE9, F2-F4            | U17 approved design artifacts and U10/U11 route/browser records are retained in the packed inventory. No new UI was introduced in U14.                                                      |
| R26-R27      | AE1-AE13, F1-F5       | Matrix, negative probes and frozen installs pass locally; CI is configured for stubbed journeys. Live final packed accounts, Horizon and stable-preview transport remain coordinator gates. |
| R28          | F1-F4                 | Published standards v0.3.0 contains the account policy and layout-aware assets; exact-export composition, workflow collection and Boost sync are verified.                                  |

## Coordinator's remaining gates

1. Link the generator PR to merged standards PR #4 and this plan. Preserve the published v0.3.1 identity; v0.3.0 evidence above is historical.
2. Confirm the actual paid Scramble Pro project's entitlement and standards redistribution rights. The installed Pro license says only "The Paid License" and links to the vendor; successful installation is not a licensing grant. See `template/PROVENANCE.md` for the exact reviewed notices and restrictions.
3. Review and commit the integrated 0.2.0 source bundle. Any template or standards changes after this proof require refreshed inventory and affected matrix checks.
4. Run the final Blacksmith generated quality/build/browser gates and record CI results. Local Bun 1.4.0 proof does not establish Ubuntu ARM runner behavior.
5. Complete the plan's live packed-generation journeys on isolated PostgreSQL/Redis and Herd mail, including both WebAuthn ceremonies and native Horizon grant/access/revoke. Repeat API cookie/CSRF and Horizon transport on the authorized stable HTTPS preview. Never label local HTTP evidence as that preview proof.
6. Record final versions, artifact digest, reciprocal PR outcomes and any unresolved requirement before publishing. The root coordinator owns all Git, PR, tag, release and deployment lifecycle actions.

No shared application fixture, database, Redis namespace, global configuration or user-owned `lefthook.yml` was changed by this preparation.
