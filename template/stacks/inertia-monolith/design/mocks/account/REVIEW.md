# Selected Companion review

Date: 2026-09-08. Status: composition selected, visual revision ready for root and owner review. B was selected by the owner. The latest owner request led this revision from Apex's visual foundation and required maximum useful shadcn reuse. Revised screenshots have not received owner sign-off.

## Current preview and artifacts

- http://127.0.0.1:4187/index.html
- [Desktop mock, 1440×900](mock.png)
- [Phone mock, 390×844](mock-mobile.png)
- Append `?screen=security`, `?screen=login`, or `?screen=deletion` to inspect a specific flow.
- Append `&state=error`, `loading`, `success`, or `empty` to inspect its preview state.

The review toolbar is not production navigation. The server serves this folder on port 4187. Restart from here with `python3 -m http.server 4187 --bind 127.0.0.1`. Browser automation uses only `f7t-design`.

## Actual verification

`verify-selected.js` renders all 14 screens in five preview states at both prescribed viewport sizes: 140 combinations. It verifies no horizontal overflow, local Space Grotesk loading, input labeling, visible main buttons at least 44px tall, and form-before-companion document order.

The same run checks passkey cancellation with a usable password fallback, recovery-code label/input-mode/focus changes, pending-to-success saving, initial deletion-dialog focus, bidirectional dialog focus wrapping, Escape and trigger-focus restoration, reduced motion, and a 3px keyboard focus ring. Signed-out screens hide account identity. Intermediate 768px and 1024px security views also have no horizontal overflow.

Results are recorded in `evidence/selected-review.json`, including measured color pairs. This is browser and targeted accessibility evidence, not a full assistive-technology audit. Account operations remain simulated. Authenticator setup labels its QR/key area as a placeholder and has no real secret.

Commands from the repository root:

```sh
dev-browser --browser f7t-design --headless --timeout 180 run template/stacks/inertia-monolith/design/mocks/account/verify-selected.js
bash ../standards/templates/scripts/screenshot.sh http://127.0.0.1:4187/index.html template/stacks/inertia-monolith/design/mocks/account/mock.png 1440x900
bash ../standards/templates/scripts/screenshot.sh http://127.0.0.1:4187/index.html template/stacks/inertia-monolith/design/mocks/account/mock-mobile.png 390x844
```

The CLI writes its generated captures into `~/.dev-browser/tmp`; retained outputs are copied into this evidence folder with relative references in the manifest. Both design homes carry identical retained outputs.

## Visual self-review

Inspected real desktop and phone profile renders, desktop sign-in, the full phone security screen, deletion confirmation, and focused profile inputs. The selected top navigation and form/companion relationship remain intact. Red is concentrated in the action and active-navigation rule; body text stays neutral. Space Grotesk and the near-black canvas follow the read-only Apex reference without its logo or product content.

Changes after the first render:

- Corrected primary foreground from near-black to pure black after measuring 4.40:1 versus the required 4.5:1. Final ratio is 4.64:1 on the exact `#e62425` primary.
- Split quiet structural borders from stronger interactive boundaries. A uniform Apex-style hairline would not identify an input clearly enough.
- Fixed the explicit hidden-identity rule after sign-in screenshots exposed a CSS display override.
- Added the security form's confirm-new-password field to match the inspected reuse composition.
- Updated deleted-account success to show signed-out navigation and removed-access context rather than a live-account summary.
- Parked the pointer away from controls before default captures so previous interaction hover states do not contaminate the evidence.

The phone companion follows the form, as selected. Full-document phone images retain below-fold content. This adds scrolling on security pages but avoids placing status prose ahead of the action.

## Measured contrast

| Semantic pair | Ratio |
| --- | --- |
| Foreground on background | 17.79:1 |
| Supporting text on card | 7.76:1 |
| Supporting text on muted | 7.08:1 |
| Primary action text | 4.64:1 |
| Error text on muted | 7.34:1 |
| Success text on muted | 10.21:1 |
| Companion supporting text | 8.27:1 |
| Input boundary against input background | 3.63:1 |
| Input boundary against card | 3.44:1 |
| Focus ring against companion | 16.01:1 |

## Evidence retention

The first pass produced approximately 12 MB per variant. Now that B's composition is selected, retain the four historical overview screenshots (`mock-a*.png`, `mock-b*.png`), both historical HTML studies, their local Public Sans font, and their original verification measurements. Remove their 156 redundant state/full-document PNGs from the generated evidence set. Their old manifests retain measured results but no longer link to pruned PNGs.

The current set retains a viewport screenshot for every default screen at both sizes, a full-document phone image for every default screen, selected failure/loading/empty/success states, and interaction captures for passkey cancellation, deletion confirmation, and keyboard focus. Required `mock.png` and `mock-mobile.png` are independently captured by the standards shooter. `selected-review.json` is the exact current screenshot manifest.

Historical `index-a.html`, `index-b.html`, `tokens.json`, `capture.js`, and `interactions.js` describe the superseded light studies. Their labels now direct reviewers to the current revision. A is not a current candidate. History is preserved to explain the owner's composition choice, not to reopen it.

## U10/U11 handoff

Read `../../DESIGN.md`, `../../tokens.css`, and `../../COMPONENT-REUSE.md`. The reuse map covers actual shadcn primitives, inspected shadcn.io sources, their demo assumptions, Base UI versus Radix composition differences, and the QR source's color parsing/quiet-zone requirements. Production code should compose those primitives and integrate real state contracts. The mock's native-dialog focus code and timeout handlers are design tooling only.

No production-route comparison or revised screenshot approval is claimed. There are no environment blockers to reviewing this revision.
