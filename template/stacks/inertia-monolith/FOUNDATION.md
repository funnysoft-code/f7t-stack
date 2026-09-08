# Inertia foundation

This tree boots Laravel 13 with PostgreSQL, Redis, Horizon and an Inertia 3 React runtime. `/up` is the framework health route. Account routes and page designs are installed by the account units.

## Local setup

Apply the pinned standards export before installing. It supplies `packages/boost-guidelines`, scripts and engineering documents. Install PHP 8.5 with `pdo_pgsql`, `redis`, `pcntl`, `posix`, `dom`, `mbstring`, and PCOV for coverage, Composer, and Bun.

Use Herd with an HTTPS site pointed at `public/`. Create a dedicated empty PostgreSQL database named after the app, then copy `.env.example` to `.env`. Confirm your actual service ports. Defaults are PostgreSQL 5432, Herd Redis 6138, and Herd SMTP 2525. A Valkey service on 6379 works through an explicit `REDIS_PORT=6379` override.

```sh
composer install --no-interaction --prefer-dist
bun install --frozen-lockfile
php artisan key:generate
php artisan migrate --force
php artisan wayfinder:generate --with-form
php artisan typescript:transform
bun run build
```

Generate a key only when `APP_KEY` is absent. Existing databases require reviewed incremental migrations, never an automatic reset. On local HTTP only, set `SESSION_SECURE_COOKIE=false`. Production and Herd HTTPS keep secure cookies enabled.

Run `bun run dev` and `php artisan horizon` in separate terminals alongside Herd. Retrieve mail in Herd's SMTP viewer. Octane is installed for the Laravel Cloud FrankenPHP process, `php artisan octane:start --server=frankenphp`; provisioning its binary and Cloud resources is a deployment task.

`REDIS_DB`, `REDIS_CACHE_DB`, and `REDIS_SESSION_DB` must be distinct. Redis URLs are deliberately not used for these connections because a URL database can override separate indexes. Allocate a dedicated cache database per app: Redis cache clearing flushes that entire database, regardless of prefix. Sessions use their own store and database. Prefixes and queue names isolate normal operations, but do not make a shared cache database safe to flush.

Horizon denies every guest, unverified user, and user without the explicit `viewHorizon` permission, including locally. U6 adds the console grant/revoke command and browser login/verification redirects. The foundation grants nobody operational access.

## Engineering

```sh
vendor/bin/pest
bash scripts/php-gate.sh all
bash scripts/frontend-gate.sh typecheck
```

PHPUnit defaults to the separate `__F7T_APP_NAME___test` PostgreSQL database. Create it before running tests, or supply a disposable database through the shell's `DB_DATABASE` environment variable. `RefreshDatabase` rebuilds that selected database. Never select the development database for tests. Tests use array cache/session and synchronous jobs; live Redis isolation proof requires separate disposable Redis databases.

Generate noun-scoped code using the included stubs:

```sh
php artisan make:action Users/UpdateUserAction
php artisan make:class Repositories/Users/UserRepository
php artisan make:data Users/UpdateUserData
php artisan make:request Users/UpdateUserRequest
php artisan make:controller Users/UpdateUserController
```

Keep one public `execute()` on Actions. Constructor-inject concrete repositories. Replace the Request's deny-by-default authorization with an explicit policy check. Use validated input and Data objects. Wayfinder output and `resources/js/types/generated.d.ts` are generated, never manually edited. Transformer 3.3 is configured through `TypeScriptTransformerServiceProvider`, without Prettier.

## Remaining units

U6 owns Fortify account routes, actions, registration settings and provisioning. U7-U9 own account settings and factors. U10-U11 own approved visible account screens. U12 owns setup automation and production service activation, including Resend, Nightwatch, PostHog and Turnstile. The health route and build runtime require no production service credentials.
