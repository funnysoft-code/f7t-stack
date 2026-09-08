# Account design

Status: composition_selected_visual_revision_ready_for_review. The owner selected B, Companion, on 2026-09-08. The subsequent owner request was to lead the visual foundation from `apex-scout-v2` and maximize useful shadcn/ui and shadcn.io reuse. The current `mocks/account/index.html` applies that request. The owner has not yet approved these revised screenshots; do not record screenshot sign-off or route comparison as complete.

## Decision provenance

1. 2026-09-08: two light-theme compositions were prepared without an invented approval.
2. 2026-09-08: owner chose B, Companion, and requested maximum useful shadcn/ui and shadcn.io reuse.
3. 2026-09-08: owner asked to be highly led by the `apex-scout-v2` design system. This supersedes the light palette and Public Sans of the studies, while preserving B's top navigation, active form, and security companion.
4. This revision applies the latest instruction. Root review and owner review of the revised pixels remain distinct from the already received composition selection.

## Design intent

Individual account tasks should be easy to find and finish. Use local Space Grotesk, dark-first surfaces, and the existing shadcn/ui kit. `COMPONENT-REUSE.md` names the exact primitives and inspected shadcn.io blocks for U10/U11, including source caveats and integration changes. Static HTML represents their appearance; its demo handlers are not production components.

### Historical A. Focus

A narrow form column with persistent account navigation, a mineral canvas, and blue actions. The initial recommendation favored this layout; the owner's B selection supersedes that recommendation. `index-a.html` and its two overview screenshots are historical evidence, not a current candidate.

Desktop: `navigation | heading / active form`. Mobile: `identity / wrapping navigation / active form`. Left-aligned type throughout. Sections use spacing and a single divider rather than nested cards.

### Selected B. Companion

Near-black canvas, a charcoal form, and a slightly lifted security companion. Space Grotesk carries the headings and compact typographic navigation. Red is reserved for the primary action and active-navigation indicator. Structural borders stay quiet; input boundaries and keyboard focus are stronger for accessibility. The companion explains verification, passkeys, and recovery coverage without a score or invented metrics.

Desktop: `top navigation / active form | security companion`. Mobile: `top navigation / active form / security companion`. The form comes first in reading and tab order. Preserve this selected composition. `index-b.html` and its old overview screenshots retain the original light treatment as history.

## Shared vocabulary

Current tokens live in `tokens.css` beside this file and are copied into `index.html`'s inline CSS. Foundation: Space Grotesk, background `#090909`, foreground `#f2f2f2`, primary `#e62425`, card `#111111`, companion `#171717`. Extend through shadcn semantic roles. Structural border `#303030` is separate from interactive input boundary `#696969`. The primary label is black `#000000` because both white and `#090909` fail the required small-text contrast on the exact red. Destructive/error text uses a lighter semantic red. A light theme is outside this revision.

Read-only reference files were `apex-scout-v2/packages/design-system/DESIGN.md`, its `tokens.css`, and `apps/scout-web/app/globals.css`. Adopted its font, near-black field, red primary, restrained surface changes, and tracked uppercase navigation. Account fields and headings remain sentence case. No Apex logos, sports content, or product navigation were copied.

Local Space Grotesk comes from `@fontsource-variable/space-grotesk@5.3.0`; its copyright and SIL Open Font License are bundled. See `mocks/account/fonts/PROVENANCE.md`. Historical Public Sans and `mocks/account/tokens.json` remain for the old studies only. Runtime font requests stay local.

Type sizes: 12–14px supporting text, 16px input/body text, 22–24px section titles, 42px desktop page titles, 34px phone titles. Navigation is 12px desktop and 11px phone, with restrained uppercase tracking following the owner's reference. Spacing uses 4/8/12/16/24/32/40/48px. Buttons and inputs are at least 44px tall. Focus uses an offset 3px light ring. Reduced motion disables transitions.

## References and decisions

- Focus: [Pipedrive password and login](https://mobbin.com/screens/c147e376-1ae1-4e2e-9b2a-c518d49306a1). Observed persistent settings navigation and separate password/two-factor sections. Adopt the grouping, not the product navigation or branding.
- Companion: [Sentry security settings](https://mobbin.com/screens/016ffb42-001f-4e8a-8d3d-70f515ca3906). Observed session-impact notice near the password action and distinct sessions/two-factor sections. Move security context beside the form as an original composition; the reference itself does not show this split layout.
- Prior coordinator evidence: [Buffer profile](https://mobbin.com/screens/4262e421-43cf-47f5-b1ce-d6c795ded945) and [Railway security](https://mobbin.com/screens/d9487163-a0d4-4702-b7e3-a8fd2aae9d29). No additional observations claimed here.
- The UI/UX database returned a documentation landing pattern. Rejected. Its accessible-authentication guidance applies: allow paste/autofill and keep password sign-in available after passkey failure.

## Review the studies

Open `mocks/account/index.html` through a static server. Local preview: http://127.0.0.1:4187/index.html. The toolbar selects a screen and state. Query parameters address each view: `?screen=security&state=error`. The toolbar is review tooling, not production navigation. All account outcomes are demo-only.

Screens: home, login, register, forgot, reset, verification, confirmation, profile, security, passkeys, authenticator, challenge, recovery, deletion. States: default, loading, error, success, empty. Content adapts to each screen, including cancelled/unsupported passkeys, recovery alternatives, unverified email, and destructive confirmation.

The required selected artifacts are `index.html`, `mock.png`, and `mock-mobile.png`. Desktop is 1440×900; phone is 390×844. No `route.png` or `route-mobile.png` is claimed because production implementation and route comparison belong to U10/U11. Revised screenshot review remains pending.

Browser evidence and measured review are recorded in `mocks/account/REVIEW.md`. Both variant design homes carry the same current tokens, selected mock, decision record, and component reuse mapping.
