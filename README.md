# create-f7t-app

FunnySoft's Bun-first generator for three application layouts:

| `--stack`          | Generated application                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `next-only`        | Next.js App Router with optional Sanity, Drizzle, shadcn, Resend and next-intl              |
| `inertia-monolith` | Laravel with Inertia and React, PostgreSQL, Redis and a complete individual account flow    |
| `api-next`         | Laravel API in `services/api`, Next.js in `apps/web`, shared API client and design packages |

## Release status

Generator **0.2.0 is not released** to npm yet. Its bundle pins published FunnySoft standards [v0.3.1](https://github.com/funnysoft-code/standards/releases/tag/v0.3.1), commit `13889e25ab3df8a06307156722dc08377183b356`. Template revision `0.2.0` identifies the generator release rather than an unknown future Git commit. Packed verification is distinct from the remaining live browser, licensing and shipping gates. See [verification and remaining gates](docs/verification/multi-stack-generator.md).

The CLI syntax below describes the pending release:

```sh
bunx create-f7t-app my-app --stack next-only --yes
bunx create-f7t-app my-app --stack inertia-monolith --yes
bunx create-f7t-app my-app --stack api-next --yes
```

Without `--yes`, a terminal wizard collects the app name and stack first. Noninteractive runs require an app name. There is no telemetry.

## Included policy and account features

All stacks receive the pinned FunnySoft playbook, OpenCode configuration, Lefthook, applicable quality scripts and GitHub Actions. These are mandatory. Next-only output has no PHP or Boost assets.

Both Laravel stacks include provisioned-user verification, configurable registration, password reset, profile and security settings, recent confirmation, optional TOTP and recovery codes, full passkey lifecycle, account deletion and permission-protected Horizon. Registration starts disabled. The initial account is created by the documented command in the generated README.

Laravel output requires PHP 8.5 with the declared extensions, Composer, Bun 1.4, PostgreSQL, Redis and Herd for guided local setup. API + Next also requires authorized Scramble Pro Composer access. Configure Composer authentication outside the generated tree. The generator never accepts or copies credentials.

Resend, Nightwatch, PostHog and Turnstile are wired, with local mail and documented development settings. Production provider connections remain manual. Follow the generated README for Laravel Cloud and Vercel deployment, fixed origins, worker roles and cache reloads.

## Options

| Flag               | Values or behavior                           | Default with `--yes` |
| ------------------ | -------------------------------------------- | -------------------- |
| `--stack`          | `next-only`, `inertia-monolith`, `api-next`  | `next-only`          |
| `--app-name`       | Folder name, or supply it positionally       | Required             |
| `--shell`          | Next-only: `site`, `app`                     | `site`               |
| `--data`           | Next-only: `none`, `sanity`, `drizzle`       | `none`               |
| `--db`             | Next-only Drizzle: `sqlite`, `postgres`      | `sqlite`             |
| `--shadcn`         | Add Next UI components                       | false                |
| `--playwright`     | Add Next smoke test and runner configuration | false                |
| `--resend`         | Add Next contact form                        | false                |
| `--intl`           | Add English and European Portuguese routing  | false                |
| `--locale`         | Next without intl: `en`, `pt-PT`             | `pt-PT`              |
| `--harness`        | Only `opencode` is accepted                  | `opencode`           |
| `--github-actions` | Mandatory quality workflows                  | true                 |
| `--no-git`         | Skip repository initialization               | Git enabled          |
| `--skip-install`   | Generate files and report setup pending      | false                |
| `--CI`             | Noninteractive `--yes`                       | false                |
| `--json`           | Machine-readable result                      | false                |
| `--help`           | Show CLI help                                | false                |

Laravel layouts have fixed PostgreSQL, UI and browser tooling. Next-specific shell, data, database, internationalization, locale and Resend options are rejected for Laravel. Policy-off flags and obsolete harness choices are errors. `--force` cannot overwrite a nonempty target.

## Local setup and recovery

Generation uses an empty `./<app-name>` directory. The packed manifest verifies standards, every template byte and the selected dependency lock before installation. Bun installs frozen locks; Composer installs the recorded lock. A dependency or service failure returns a nonzero result with a named stage and recovery command.

`--skip-install` produces files only. Run `bun run setup` in the generated root to resume. Setup preserves existing environment files, application keys and data. A project is not locally ready until setup and the documented checks finish successfully.

## Development and release preparation

```sh
bun install --frozen-lockfile
bun run check
bun run build
bun run verify:package
bun run verify:release
```

`verify:release` verifies the published standards pin, complete asset inventory and all supported lock keys. Publishing runs it automatically. The CI release jobs use the bundled export, never a sibling checkout, and never enable candidate mode.

Offline preparation and packed matrix commands are documented in [the U14 verification record](docs/verification/multi-stack-generator.md). The fast suite exercises all 192 normalized Next configurations. The release catalog contains 64 Next selection keys and both Laravel layouts. All 66 keys receive frozen installs in the packed matrix, including keys that currently resolve to identical dependency graphs.

Upgrading existing applications, Expo, alternative package managers and automatic production account connections are outside the generator's scope.

## License

Generator code is MIT. Bundled templates and fonts retain their own notices. Private dependencies are installed through authorized sources and are not redistributed. See [template provenance](template/PROVENANCE.md) for license scope and release restrictions.
