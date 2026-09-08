# Inertia foundation

This tree boots Laravel 13 with PostgreSQL, Redis, Horizon and an Inertia 3 React runtime. `/up` is the framework health route. Fortify owns account authentication; approved page designs are installed by the UI units.

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

Horizon denies every guest, unverified user, and user without the explicit Spatie `view-horizon` permission, including locally. The Laravel ability remains `viewHorizon`. The foundation grants nobody operational access.

## Accounts

Registration is disabled by default. `config/funnysoft.php` is authoritative and the `capabilities.registrationEnabled` Inertia prop reflects it. Set `FUNNYSOFT_REGISTRATION_ENABLED=true` to enable signup. During deployment, rebuild both caches and reload long-running application workers:

```sh
php artisan config:cache
php artisan route:cache
php artisan octane:reload
```

For ordinary local development use `config:clear` and `route:clear` instead. Changing an environment value alone does not change already cached configuration. The request-time guard rejects registration through stale enabled route caches after the active configuration is disabled. Both the page and submission routes are omitted on a fresh disabled route build.

Provision the first account without opening signup:

```sh
php artisan funnysoft:create-first-user --name="First User" --email="first@example.test"
```

Passwords and confirmation are hidden prompts, never command-line arguments. Use at least 12 characters. The command refuses any nonempty users table, serializes its empty-table check and insert inside a PostgreSQL transaction, and sends verification mail after commit. The new user has no roles or operational grants and must verify their email. If mail fails, the account is retained: fix the local SMTP transport, sign in, then resend from `/email/verify`. Re-running bootstrap will not create a second account. Verification and password-reset messages appear in Herd's SMTP viewer using the default local configuration.

The separate operational command changes only one named user's Horizon permission:

```sh
php artisan funnysoft:horizon-permission grant first@example.test
php artisan funnysoft:horizon-permission revoke first@example.test
```

Granting the permission never verifies the account. Unknown accounts and actions other than `grant` or `revoke` fail.

### Account HTTP contracts for U7 and U10

Fortify 1.39 supplies the controllers, password broker, signed verification request, session rotation and mutation responses. `routes/auth.php` loads its native route definitions inside the application-owned routing lifecycle. Account pages have response bindings without bundled production screens. Normal page requests render the named Inertia component; JSON requests return `{ component, props }` for contract testing. Inertia requests retain the native protocol.

| Route name | Method and path | Component or behavior |
| --- | --- | --- |
| `login` / `login.store` | GET / POST `/login` | `auth/login`; successful JSON login returns `two_factor: false` |
| `logout` | POST `/logout` | Invalidate session and CSRF token; JSON 204, browser `/login` |
| `register` / `register.store` | GET / POST `/register` | Conditional `auth/register`; JSON 201, browser verification notice |
| `password.request` / `password.email` | GET / POST `/forgot-password` | `auth/forgot-password`; uniform status for known, unknown and broker-throttled emails |
| `password.reset` | GET `/reset-password/{token}` | `auth/reset-password`, with `token` and `email` props |
| `password.update` | POST `/reset-password` | Native reset broker; uniform invalid/expired-link field error |
| `verification.notice` | GET `/email/verify` | `auth/verify-email`; authenticated, unverified-safe |
| `verification.send` | POST `/email/verification-notification` | Authenticated, unverified-safe; named six-per-minute limiter |
| `verification.verify` | GET `/email/verify/{id}/{hash}` | Native signed UUID user ID plus current-email hash checks |
| `password.confirm` / `password.confirm.store` | GET / POST `/user/confirm-password` | `auth/confirm-password`; native recent-password confirmation |
| `password.confirmation` | GET `/user/confirmed-password-status` | Native confirmation status |
| `home` | GET `/` | `home`; requires authentication and verified email |

Every account page receives `capabilities.registrationEnabled` and nullable `status`. `AuthCapabilitiesData::current()` is the shared source for subsequent account page props. No raw user model or credentials are included. U7 should keep notice, resend and logout outside verified-only groups and protect application data with both `auth` and `verified`. Vendor profile/password update features are disabled so they cannot bypass the U7 settings boundary. U8-U9 own factor enablement and its contracts. Browser integration and screen states follow the approved U10 design.

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

U7-U9 own account settings and factors. U10-U11 own approved visible account screens. U12 owns setup automation and production service activation, including Resend, Nightwatch, PostHog and Turnstile. The health route and build runtime require no production service credentials.
