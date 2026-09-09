# Multi-stack implementation receipt

## Latest delivery identity: standards v0.3.3

- Generator checkpoint before this rebundle: `0334976b51d3d04e71f87ffe6f6b0d8c577983a3`.
- Generator and template version: `0.2.0`.
- Published standards: `v0.3.3`, commit `0d955d9297027749f660bae2ca489710f9ffd599`, merged through standards PR #6. Remote tag and published release metadata independently verified.
- Standards export digest: `62d9b0e0b8055d0fc9c52f25d02872faf1a65ec7e5f962163cb9fe96bf0f79be`.
- Latest archive SHA-256: `b09b807a7eb9249ad1e346018afada4403a2d8eb9caa017111b3e014deab21df`.
- Artifact: `u14-release-033/packed/create-f7t-app-0.2.0.tgz` under the approved temporary root documented in [package verification](multi-stack-generator.md).

Latest local results: **962 package files**, **194 generated outputs**, three negative probes, **405 root tests passed / 7 opt-in skips**, and all **49 archived standards gate assertions** pass. All package source bytes match the extracted archive. This refresh performs **zero new installs**; all 66 lock keys and dependency fingerprints are unchanged.

The only v0.3.2 archive changes are two PHP quality scripts, documentation and integrity metadata. Both freshly generated Laravel scripts match the corrected, real-suite-tested template after PHP-root substitution. The retained production-INI runs pass 100% named line/type coverage with unchanged test counts: Inertia 115 / 968 assertions, API 117 / 967 assertions. These are prior root-owned test executions, not new full suite runs during packaging.

All **359 HTTPS runtime hashes** match current source and the v0.3.3 archive. Application runtime is unchanged; the PHP quality command is not production runtime. No new full-runtime or provider-deployment execution is claimed. Earlier identities and results follow as history.

### Latest hosted CI stage

[Run 34299590161](https://github.com/funnysoft-code/f7t-stack/actions/runs/34299590161) at `0334976` passed root check, packed/frozen matrix and all six Next generated gates. Only the two Laravel jobs failed on the diagnosed assertion/coverage issue. Published standards v0.3.3 adds `-d zend.assertions=1` only to the coverage command. Local affected verification is green; hosted retry for the new pin is pending the coordinator's commit/push. Hosted Composer installation already succeeded in the packed-matrix job.

## Historical v0.3.1 source and delivery identity

- Plan: `docs/plans/2026-09-08-1207-feat-multi-stack-generator-plan.md`.
- Plan SHA-256: `bbf032cec55abe5d1a4121a0b092c5f396e2d2dbd51eefca8cb6e8c267bdddcd`.
- Application/package checkpoint: `ff01d4e`.
- Generator and template version: `0.2.0`.
- Standards: `v0.3.1`, commit `13889e25ab3df8a06307156722dc08377183b356`.
- Standards export digest: `9617fb25af0eab734dd99ac5fc4d1b8d186b9b5214b6ae4ec5cce70263d9aa42`.
- Final candidate archive SHA-256: `a8076d66f6eb4d6c82144724e703da5afad03a186c1516cabf4961724de05605`.

## Historical v0.3.1 verification result

Implementation and local verification are complete for the selected three-stack scope. U14 package delivery has passed local checks; hosted CI and final release acceptance remain open. This receipt does not mark the overall plan complete.

| Evidence                     | Result                                                                      |
| ---------------------------- | --------------------------------------------------------------------------- |
| Root generator check         | 401 passed, 7 opt-in skips; lint, format and types pass                     |
| Root release verification    | 962 files                                                                   |
| Final candidate generation   | 194 outputs, three negative probes                                          |
| Frozen dependencies          | 66 keys verified on unchanged dependency inputs, Node 22.23.2 and Bun 1.4.0 |
| Full PHP checks              | Inertia 115 tests / 968 assertions; API 117 / 967, worker runs              |
| Named PHP line/type coverage | 100% in both layouts                                                        |
| Frontend library tests       | Inertia 18; API 127, with configured coverage passing                       |
| Root browser suites          | Inertia 13; API 32                                                          |
| Migrated database contracts  | UUID route inference and fresh API schema checks pass                       |
| Stable local HTTPS           | AE3-AE10 and AE13 pass in both Laravel layouts                              |
| Runtime parity               | Root verified all 359 HTTPS-tested files against final archive and source   |

The final archive differs from the HTTPS-tested archive only in three PHP tests and their integrity hashes. No new runtime execution is claimed for the later archive. The frozen-install receipt likewise applies through unchanged dependency fingerprints and lock bytes.

## Review and unit records

The full generator review produced six findings. Backend, frontend and standards fixes resolved them, with targeted rereviews. Subsequent HTTPS findings and clean-fixture test defects were also fixed and reviewed. The final packaging review has no actionable findings. Reviews used native OpenCode sessions; external cross-model verification is not claimed.

- U1-U2: published standards releases and merged standards PRs [#3](https://github.com/funnysoft-code/standards/pull/3) and [#4](https://github.com/funnysoft-code/standards/pull/4).
- U3-U12, U15-U17: implementation commits and account/security evidence linked by [generator verification](multi-stack-generator.md).
- U13: [standards conformance](u13-standards-conformance.md).
- U14: [package evidence](multi-stack-generator.md), [packed HTTPS journeys](u14-packed-live.md), [route/schema diagnosis](u14-route-schema-check.md), and [proxy/cache regressions](u14-proxy-cache-fix.md).

## Remaining delivery boundaries

- Hosted Blacksmith CI must pass for the new v0.3.3 PR revision. Root checks, frozen installs and all six Next jobs passed in the preceding run; the corrected Laravel coverage jobs await retry.
- Hosted Vercel/Laravel Cloud previews, actual Cloud proxy addresses and production-provider activation have not been verified or provisioned.
- The owner confirmed Solo Scramble Pro use as FunnySoft's sole developer. The update-period entitlement and downstream license boundaries are recorded in [dependency entitlements](dependency-entitlements.md).
- Revised screenshot owner approval remains unclaimed. Browser inspection and screenshots are recorded in the design and live-verification reports.
- Npm publication, generator tag/release and overall release-ready status remain pending.

## Orchestrator state

```yaml
status: local-verification-complete-release-gates-open
source_kind: plan
source_digest: bbf032cec55abe5d1a4121a0b092c5f396e2d2dbd51eefca8cb6e8c267bdddcd
behavior_change: true
standalone_shipping_skipped: true
requested_route: native OpenCode coordinator and bounded workers
actual_route: native OpenCode
requested_model: unspecified
actual_model: unverified
implementation_engine_binding: null
fallback_reason: null
run_id: null
plan_checkpoint: 0334976
settled_decision_conflicts: []
release_acceptance_complete: false
```
