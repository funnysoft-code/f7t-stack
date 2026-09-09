# U14 route and schema verification

## Verdict

Coordinator follow-up: the separate proxy-test and Vite-manifest failures recorded below were fixed in `7168210`, reviewed, and verified with full PHP gates. See [proxy/cache verification](u14-proxy-cache-fix.md). The historical failures below do not describe the final candidate's current status.

The packed Inertia passkey type error and API schema error were caused by missing database setup. No route, model, DTO, schema snapshot, or generator change is needed for either failure. This slice does not require repacking.

Fresh generation against migrated PostgreSQL produces a string passkey ID. API schema check mode matches both committed artifacts byte for byte without rewriting them.

## Candidate and isolation

Verification used the idle `packed/fixture-192` and `packed/fixture-193` applications beneath:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-final
```

Dedicated PostgreSQL databases are `f7t_u14_route_inertia` and `f7t_u14_route_api`. Redis prefixes, queue names, and Horizon prefixes use those same identifiers. PostgreSQL listens on 5432, Redis on 6379. No database or Redis-wide flush was issued. The databases remain available for coordinator verification.

Compared 111 Inertia application files and 76 API application files with the current combined source. All compared content matched, allowing the generator's app-name substitution. The Inertia `resources/js/types/gitignore` source is emitted as `.gitignore`, not a missing application file. The comparison included backend routes and migrations, Inertia resources, API client snapshots, and API frontend source.

## Causal proof

1. Ran Inertia `bun run typecheck` with `DB_DATABASE=f7t_u14_route_missing`, a nonexistent database. It reproduced TS2345 at the passkey delete call because Wayfinder emitted a numeric argument.
2. Inspected installed `vendor/laravel/wayfinder/src/BindingResolver.php`. `getColumns()` tries database schema inspection, then catches connection failures and parses the model docblock.
3. The installed vendor `Laravel\Passkeys\Passkey` docblock declares `@property int $id`. That explains the numeric fallback when the database is unavailable.
4. Created each dedicated database through the generated `scripts/setup.php database` helper and ran migrations. PostgreSQL reports `passkeys.id` as `uuid` for Inertia.
5. Ran Inertia `bun run typecheck` again against the migrated database. Wayfinder and TypeScript transformation ran fresh, and typechecking passed. `resources/js/routes/passkey/index.ts` now accepts `string | { id: string }` for the delete route.
6. Ran API `bun run check:schema` against its migrated database. Fresh Scramble export and OpenAPI TypeScript generation matched the packaged JSON and declaration snapshots.

Context7 lookup for `/laravel/wayfinder` confirmed schema-first binding inference and the docblock fallback. Installed dependency source established the behavior for this exact candidate.

## Commands

From each fixture root, export the appropriate dedicated identifier before the commands below:

```sh
export DB_CONNECTION=pgsql
export DB_DATABASE=f7t_u14_route_inertia # API uses f7t_u14_route_api
export DB_USERNAME=postgres
export DB_PASSWORD=
export REDIS_PORT=6379
export REDIS_PREFIX="$DB_DATABASE:"
export REDIS_QUEUE="$DB_DATABASE"
export HORIZON_PREFIX="$DB_DATABASE:horizon:"
```

Inertia preparation and contract verification:

```sh
APP_ENV=local php scripts/setup.php database "$DB_DATABASE"
php artisan key:generate --force --no-interaction
php artisan migrate --force --no-interaction
bun run typecheck
bun run build
bun run lint
bun run test
bun run doctor
bun run check:php
php vendor/bin/pest --type-coverage --min=100 --compact
```

API preparation runs from `services/api`:

```sh
APP_ENV=local php ../../scripts/setup.php database "$DB_DATABASE"
php artisan key:generate --force --no-interaction
php artisan migrate --force --no-interaction
php vendor/bin/pest --type-coverage --min=100 --compact
```

API root checks:

```sh
export F7T_TRANSPORT_DATABASE="$DB_DATABASE"
./node_modules/.bin/playwright install chromium
bun run check:schema
bun run lint
bun run typecheck
bun run test
bun run doctor
bun run check:workflows
bun run check:php
```

Application keys were generated only in the disposable fixture environments. Values were not printed. Existing installed dependencies were reused. Full setup, including Boost and SMTP checks, was not rerun; this pass exercised its database, migration, and contract stages directly.

## Results

| Gate                          | Inertia               | API                       |
| ----------------------------- | --------------------- | ------------------------- |
| Fresh route/schema generation | Pass                  | Pass, snapshots unchanged |
| Frontend typecheck            | Pass                  | Pass                      |
| Frontend lint and formatting  | Pass                  | Pass                      |
| Frontend tests                | 18 passed, 100% lines | 127 passed, 100% coverage |
| React Doctor                  | Pass                  | Pass                      |
| Workflow gate                 | Not applicable        | Pass                      |
| Production build              | Pass                  | Not run in this slice     |
| Pint, PHPStan max, Rector     | Pass                  | Pass                      |
| PHP type coverage             | 100%                  | 100%                      |
| Complete PHP suite            | 107 passed, 8 failed  | 109 passed, 8 failed      |

The eight remaining PHP failures in each stack are all `TrustedProxyTest`. Tests assign `$_ENV['TRUSTED_PROXIES']`, but the generated `.env` also supplies an empty `TRUSTED_PROXIES` value. The trusted-loopback cases and invalid-entry cases do not observe the test override. This separate proxy-test isolation issue is outside this worker's route/schema ownership and was reported to the coordinator. Full PHP gates are not green.

Initial broader attempts also lacked application keys, the Inertia build manifest, the correct local Redis port, or Chromium. After supplying those prerequisites, the results above remained. No application logic was changed to accommodate setup omissions.

## Setup ordering

`template/shared/setup-runtime.ts` creates the dedicated database, runs migrations, then generates contracts. Root `.github/workflows/ci.yml` prepares the key and migrations before generated checks. That order already handles the route/schema prerequisite.

The current CI command runs `bun run check && bun run build`. On a clean Inertia fixture, the session-bearing HTML test additionally requires the Vite build manifest. This pass built before repeating PHP verification. The coordinator should resolve that clean-CI build-order prerequisite alongside the proxy-test failures.

## Raw evidence

Logs live in the candidate directory above:

- `inertia-route-before.log`, `inertia-route-after.log`
- `api-route-schema-after.log`
- `inertia-route-build.log`, `inertia-route-lint.log`, `inertia-route-unit.log`, `inertia-route-doctor.log`
- `api-route-lint.log`, `api-route-typecheck.log`, `api-route-unit.log`, `api-route-doctor.log`, `api-route-workflows.log`
- `inertia-route-php.log`, `api-route-php.log`
- `inertia-route-php-types.log`, `api-route-php-types.log`

This report is the only repository file added by this worker.
