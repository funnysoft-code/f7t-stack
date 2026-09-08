# Run the foundation locally

Use PHP 8.5, Composer 2, Bun 1.4, and Herd PostgreSQL, Redis, and mail.
The repository must first receive its pinned standards export. It supplies the
gate scripts and the local Boost guidelines Composer package.

1. Create a PostgreSQL database for the application and a separate test database.
2. Copy `services/api/.env.example` to `services/api/.env`. Set the database name
   and Herd database username. Never use a production database for tests.
3. In `services/api`, run `composer install`, then `php artisan key:generate`
   and `php artisan migrate`. Scramble Pro requires the purchaser's existing
   Composer authentication for `satis.dedoc.co`. Installation is incomplete
   until that dependency installs successfully.
4. At the repository root, run `bun install` and `bun run build`.
5. Run each process in its own terminal:

   ```sh
   # services/api, or serve its public directory through Herd
   php artisan serve --host=127.0.0.1 --port=8000
   php artisan horizon
   php artisan schedule:work
   # repository root
   bun run dev
   ```

Laravel's `/up` and Next's `/health` are the foundation probes. Next's health
response does not claim that Laravel or its databases are reachable. The
account pages, Fortify route registration, and API transport are subsequent
implementation units. Fortify is installed but its package routes are held
closed until Identity supplies the account policy.

Herd mail listens on `127.0.0.1:2525`. Open Herd's Mail viewer to retrieve local
messages. No production email key is needed. Later integration setup owns
Resend, Nightwatch, PostHog, and Turnstile activation.

Redis defaults use database 0 for queues/locks, 1 for cache, and 2 for sessions.
Use separate `REDIS_CACHE_URL` and `REDIS_SESSION_URL` values when deploying
with connection URLs. Never point cache and sessions at the same Redis database:
`cache:clear` flushes the cache database regardless of key prefix. Provision
separate services if a host does not support Redis database selection.

## Verify

Generate domain classes with the installed application stubs:

```sh
php artisan make:domain action Identity Users/CreateUserAction
php artisan make:domain request Identity Users/StoreUserRequest
php artisan make:domain data Identity Users/StoreUserData
php artisan make:domain repository Identity Users/UserRepository
php artisan make:domain controller Identity Users/UserController
```

The generator requires an existing module and the kind's class suffix. It
rejects path traversal and refuses to overwrite an existing class. Wire the
request's policy and validation before registering a route.

Set `DB_DATABASE` to the dedicated test database when running tests. PHPUnit
defaults to `__F7T_APP_NAME___test`, and Redis databases 13, 14, and 15. The
foundation cache-isolation test clears database 14. Those databases must be
dedicated to this test suite. `APP_KEY` must be generated before running tests.

```sh
# services/api
DB_DATABASE=__F7T_APP_NAME___test vendor/bin/pest
# repository root
bun run typecheck
bun run test
bun run check
```

All generated gates remain mandatory. Schema and account workflow gates become
executable when their implementation units add the contracts and journeys.
Production runs Octane with FrankenPHP and Horizon on Laravel Cloud, and Next
on Vercel. Hosting accounts and deployments are connected separately.
