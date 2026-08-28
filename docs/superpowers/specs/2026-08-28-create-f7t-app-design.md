# create-f7t-app

FunnySoft's Next.js app generator. Same job as [create-t3-app](https://create.t3.gg/): an interactive CLI that copies a base template and optional extras. Not a Laravel product, not an Apex Scout monorepo, not a docs marketing site.

Invoke: `bunx create-f7t-app@latest`

This repo is the CLI package. README is the docs.

## Axioms

Taken from T3, restated for FunnySoft.

1. **Solve problems.** An extra exists only if a real FunnySoft Next app needed it more than once. Contact/Resend is in. Auth is not. A leftover `post` router is not.
2. **Bleed on lint, not on data.** bun, oxlint, oxfmt, React Doctor are the sharp edge. Postgres stays Postgres. SQLite is an explicit Drizzle choice, not a hidden default.
3. **Typesafety is not optional.** TypeScript `strict` plus `noUncheckedIndexedAccess`. Every env var is declared in `src/env.js` via `@t3-oss/env-nextjs` and listed in `.env.example`.

## v1 shape

One kind of app: Next.js App Router on bun.

**Always on**

- bun (no npm / pnpm / yarn prompt)
- Next.js App Router, React 19, `src/` directory
- Import alias `~/*` → `src/*`
- TypeScript strict
- Tailwind CSS v4
- oxlint, oxfmt
- vitest (`passWithNoTests: true`)
- React Doctor via `bunx react-doctor@0.9.12 . --no-telemetry -y` inside `bun run check` (not a package dependency). Bump the pin on purpose, same as other versions.
- `AGENTS.md`
- `@t3-oss/env-nextjs`
- `bun run check` = oxlint + oxfmt --check + tsc --noEmit + vitest run + react-doctor

**Never in v1**

- tRPC
- Auth.js / Clerk / Better Auth / NextAuth
- Prisma
- Laravel, Inertia, Expo, Turborepo
- Package manager picker
- Docs site (`www/`)
- Sample `Post` table or leftover T3 demo router
- Telemetry
- Upgrading an existing app

**Wizard, this order**

1. App name (folder + `package.json` name)
2. Shell: Site | App
3. Data: None | Sanity | Drizzle. If Drizzle: SQLite | Postgres
4. ShadCN, default no
5. Playwright, default no
6. Resend contact form, default no
7. next-intl, default no. If no: `en` | `pt-PT`, default `pt-PT`. If yes: locales `en` + `pt-PT`, default locale `en`
8. Harness: None | Grok | Cursor | Both
9. GitHub Actions, default yes
10. Git init, default yes, then `bun install`

`--yes` uses those defaults with shell `site` and data `none`.

Non-interactive flags (every prompt has one):

| Flag | Values | Default with `--yes` |
| --- | --- | --- |
| `--app-name` | string, required when not a TTY | none |
| `--shell` | `site` \| `app` | `site` |
| `--data` | `none` \| `sanity` \| `drizzle` | `none` |
| `--db` | `sqlite` \| `postgres` | ignored unless `--data drizzle`; then `sqlite` |
| `--shadcn` | boolean | false |
| `--playwright` | boolean | false |
| `--resend` | boolean | false |
| `--intl` | boolean | false |
| `--locale` | `en` \| `pt-PT` | `pt-PT` when `--intl` is false; ignored when `--intl` is true |
| `--harness` | `none` \| `grok` \| `cursor` \| `both` | `none` |
| `--github-actions` | boolean | true |
| `--git` | boolean | true |
| `--yes` | skip prompts | false |
| `--force` | write into a non-empty directory | false |

`--CI` is an alias of `--yes` plus no spinner nonsense, for generator tests.

Target directory is `./<app-name>` under the current working directory. If it exists and is not empty, abort unless `--force`. `--data drizzle` without `--db` uses SQLite so a non-interactive run does not need Docker.

## Architecture

Single npm package `create-f7t-app`. No workspace, no turbo, no `www/`.

```
cli/src/                 # prompts, flag parsing, installers
template/base/           # always-on Next app
template/extras/         # one folder per extra
  shell-site/
  shell-app/
  sanity/
  drizzle-sqlite/
  drizzle-postgres/
  shadcn/
  playwright/
  resend/
  next-intl/
  harness-grok/
  harness-cursor/
  github-actions/
```

CLI runtime: bun, TypeScript, `@clack/prompts`, commander.

Flow:

1. Parse flags or run the wizard
2. Create the target directory
3. Copy `template/base`
4. Run installers in this order: data → intl → shell → shadcn → resend → playwright → harness → github-actions
5. Rewrite `AGENTS.md` from the extras that actually landed
6. Git init if requested
7. `bun install` in the target
8. Print next steps (dev, check, extra-specific: compose, typegen, playwright install, migrate)

Intl runs before shell. The intl extra creates `src/i18n/*`, `src/app/[locale]/layout.tsx`, and a root `src/app/layout.tsx` that only passes `children` through (next-intl's required split). Shells then write into `src/app/[locale]/` when intl is on, and into `src/app/` when it is off. `AGENTS.md` is last so it cannot document Drizzle on a Sanity app.

Each installer may copy files, merge `package.json` scripts/deps, append `.env.example` keys, and extend `src/env.js`. Installers do not rewrite files owned by a later installer. If two extras need the same file, the later installer in the order above owns the merge, or the extra ships a snippet the earlier one knows how to insert. Prefer separate files over in-place edits.

## Base template

Next 16, React 19, Tailwind 4, `src/`.

- `src/app/layout.tsx`: root layout, `<html lang>` from the single locale (or `en` when intl will take over). Fonts via `next/font`. No header.
- `src/app/page.tsx`: a heading so the app renders before the shell installer replaces it. Shells always replace this file.
- `src/app/globals.css`: Tailwind v4 import only
- `src/env.js`: `NEXT_PUBLIC_SITE_URL` only
- `.env.example`, `.gitignore`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- oxlint and oxfmt config files
- `vitest.config.ts` with `passWithNoTests: true`. No dummy test file.
- `package.json` scripts: `dev`, `build`, `start`, `check`, `lint`, `fmt`, `fmt:check`, `typecheck`, `test`
- Pinned versions for Next, React, Tailwind, oxlint, oxfmt, vitest, TypeScript. Bump on purpose. No `latest`.
- `packageManager` field set to the bun version used to develop the CLI

`bun run check` must pass on a freshly generated base+site app with no other extras.

## Extras

### shell-site

Marketing layout: header, one section, footer. Copy and nav live in `src/lib/site.ts` (name, locale, nav, contact placeholders). No congratulations card. No stack receipt. No sidebar dashboard.

### shell-app

App layout: top nav plus `<main>`. Same `src/lib/site.ts` for the product name. Not a widget dashboard. Not shadcn-dependent. If shadcn is also on, the shell may import `Button`; if not, it uses plain elements.

### sanity

Mutually exclusive with Drizzle.

- Embedded Studio at `/studio` (`src/app/studio`)
- `siteSettings` singleton only. No blog, no post, no author.
- `next-sanity`, GROQ client, `bun run typegen`
- Env: project id, dataset, read token optional, revalidate secret optional
- Pages read `siteSettings` and fall back to `src/lib/site.ts`

### drizzle-sqlite

Mutually exclusive with Sanity.

- Driver: bun's SQLite
- `src/server/db/schema.ts` with no sample `Post` table. Empty schema is valid.
- `src/server/db/index.ts`, `drizzle.config.ts`
- Scripts: `db:generate`, `db:migrate`, `db:studio`
- `.env`: `DATABASE_URL=file:./dev.db`
- Route handlers (not tRPC) if the app later needs queries. The extra does not generate a sample API.

### drizzle-postgres

Same schema and scripts as SQLite. `postgres` driver. `compose.yaml` with Postgres. `.env.example` has a compose-matching `DATABASE_URL`. Next steps tell the user to `docker compose up -d && bun db:migrate`.

### shadcn

Vendored into `template/extras/shadcn`. The generator does not call `bunx shadcn add` (needs network, drifts).

- Base UI, not Radix
- `components.json`, `src/lib/utils.ts` (`cn`), `src/components/ui/button.tsx`
- Tailwind tokens in `globals.css` as required by the vendored files

### playwright

- `playwright.config.ts`, `e2e/smoke.spec.ts` visits `/`
- Script `test:e2e`
- Next steps include `bunx playwright install`
- Does not run browsers inside the generator

When next-intl is on, `/` is the default-locale home (`en`, unprefixed). The smoke spec still hits `/`.

### resend

- `POST /api/contact` route handler, Zod body, Resend
- Page: `/contact` when locale is `en` or when next-intl is on. `/contacto` only when the single locale is `pt-PT` and next-intl is off
- Env: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`
- Does not write to Drizzle. Does not use tRPC.
- With next-intl, pathnames stay `/contact` in both locales. Copy is translated. No localized pathnames in v1.

### next-intl

Hard extra. If the app-tree rewrite is not clean, cut the extra from v1 rather than ship a half-wired `[locale]`.

- `src/app/[locale]/` for the site/app pages
- `src/i18n/routing.ts`, `request.ts`, `en.json`, `pt-PT.json`
- Default locale `en`, `localePrefix: 'as-needed'`
- Sanity Studio stays at `/studio`, not under `[locale]`
- API routes stay at `src/app/api/`

### harness-grok / harness-cursor

Thin trees that point at `AGENTS.md`. They do not copy Apex Scout's full harness.

- Grok: `.grok/` with a short Next+bun rule
- Cursor: `.cursor/rules/` with the same constraints
- Both: both trees
- None: `AGENTS.md` only
- No `.claude/` in v1 unless we later decide Cursor also implies Claude parity

### github-actions

- `.github/workflows/ci.yml` runs `bun run check`
- If Playwright is on, a second job runs `test:e2e` (Playwright browsers installed in CI)

## Generated AGENTS.md

Rewritten at the end. Only documents extras that exist.

Always includes:

- One-line project description (app name + Site/App)
- Stack list
- Commands: install, dev, check, build, plus extra scripts
- `src/` layout
- Conventions: `~/*`, bun, Route Handlers + Zod, no tRPC
- Do-not list: secrets, force-push, drive-by refactors, hand-editing ignored generated files (Sanity `schema.json` / types when that extra is on)

## Contact and locale rules

| intl | locale | contact path | `<html lang>` |
| --- | --- | --- | --- |
| off | `pt-PT` | `/contacto` | `pt-PT` |
| off | `en` | `/contact` | `en` |
| on | `en` + `pt-PT` | `/contact` (and `/pt-PT/contact`) | from active locale |

## Testing this repo

1. Unit: flag parsing and default matrix for `--yes`
2. Fixture: a few `--CI` generations assert files exist / do not exist (Sanity files absent when `--data none`, no `compose.yaml` on SQLite, no `.cursor` when harness none)
3. Integration: generate `base + site + github-actions` and run `bun run check` inside it

Combos the fixture suite must cover:

- `--yes` (site, no data)
- site + sanity + resend + locale pt-PT
- app + drizzle postgres + shadcn
- site + intl + playwright + harness both

Full extra matrix is not a v1 CI gate.

## Publish

- Package name: `create-f7t-app`
- Bin: `create-f7t-app`
- `files`: compiled CLI + `template/**`
- License: MIT
- No telemetry
- README: why it exists, axioms, wizard, flags, always-on list, out of scope

Until the first real publish, `bunx .` from this repo is the development invoke.

## Out of scope (explicit)

Laravel, Inertia, Expo, Auth, tRPC, Prisma, a T3 docs site, upgrading existing apps, npm/pnpm/yarn, `.claude/` parity, localized pathnames, sample domain models, wrapping `create-next-app`.
