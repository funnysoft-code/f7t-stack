# create-f7t-app

FunnySoft's Next.js app generator. Same job as [create-t3-app](https://create.t3.gg/): an interactive CLI that copies a base template and optional extras. Not a Laravel product, not an Apex Scout monorepo, not a docs marketing site.

```bash
bunx create-f7t-app@latest
```

No telemetry.

## Axioms

Taken from T3, restated for FunnySoft.

1. **Solve problems.** An extra exists only if a real FunnySoft Next app needed it more than once. Contact/Resend is in. Auth is not. A leftover `post` router is not.
2. **Bleed on lint, not on data.** bun, oxlint, oxfmt, React Doctor are the sharp edge. Postgres stays Postgres. SQLite is an explicit Drizzle choice, not a hidden default.
3. **Typesafety is not optional.** TypeScript `strict` plus `noUncheckedIndexedAccess`. Every env var is declared in `src/env.js` via `@t3-oss/env-nextjs` and listed in `.env.example`.

## Always on

- bun (no npm / pnpm / yarn prompt)
- Next.js App Router, React 19, `src/` directory
- Import alias `~/*` → `src/*`
- TypeScript strict
- Tailwind CSS v4
- oxlint, oxfmt
- vitest (`passWithNoTests: true`)
- React Doctor via `bunx react-doctor@0.9.12 . --no-telemetry -y` inside `bun run check`
- `AGENTS.md`
- `@t3-oss/env-nextjs`
- `bun run check` = oxlint + oxfmt --check + tsc --noEmit + vitest run + react-doctor

## Wizard order

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

## Flags

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
| `--no-github-actions` | disable GitHub Actions | (inverse) |
| `--git` | boolean | true |
| `--no-git` | skip git init | (inverse) |
| `--yes` | skip prompts | false |
| `--CI` | alias of `--yes` plus quiet CI mode | false |
| `--force` | write into a non-empty directory | false |
| `--skip-install` | CI only; skip `bun install` | false |

`--CI` is an alias of `--yes` plus no spinner nonsense, for generator tests.

`--skip-install` is a CI-only escape hatch (fixture and live checks). It is not a wizard prompt.

Target directory is `./<app-name>` under the current working directory. If it exists and is not empty, abort unless `--force`. `--data drizzle` without `--db` uses SQLite so a non-interactive run does not need Docker.

## Out of scope

Laravel, Inertia, Expo, Auth, tRPC, Prisma, a T3 docs site, upgrading existing apps, npm/pnpm/yarn, `.claude/` parity, localized pathnames, sample domain models, wrapping `create-next-app`.

## Development

Until the first real publish, invoke the CLI from this repo:

```bash
bun cli/src/index.ts
```

## License

MIT
