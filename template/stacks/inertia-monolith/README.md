# `__F7T_APP_NAME__`

Laravel 13, PHP 8.5 and Inertia React. Bun manages the frontend; Composer manages PHP dependencies.

## Initialize locally

Use Herd Pro with PHP 8.5 for both the CLI and this site. Check `php -v` and `herd php -v` from this directory. If needed, select this site's PHP with `herd isolate 8.5`. Required PHP extensions include ctype, curl, DOM, fileinfo, filter, hash, intl, mbstring, OpenSSL, pcntl, PDO PostgreSQL, phpredis, session, tokenizer and XML. Composer's locked platform check verifies transitive requirements too.

Start PostgreSQL, Redis or Valkey, and Herd's Mail service. The example ports are PostgreSQL 5432, Redis 6138 and SMTP 2525. Check Herd's actual services with `herd services:list`. If your Valkey runs on 6379, set `REDIS_PORT=6379` in the generated `.env` and rerun setup. Setup copies `.env.example` only when `.env` is absent. It never replaces existing local settings.

```sh
bun run setup
```

Setup checks prerequisites, creates local configuration, installs frozen Bun dependencies and locked Composer dependencies, checks both PHP platforms, authenticates with PostgreSQL and Redis, checks SMTP, generates an absent application key, creates the dedicated project database, migrates and generates Wayfinder and TypeScript contracts. Composer uses your existing credential configuration. Do not put authentication files or package credentials in this repository.

The database is named `f7t_<directory-slug>_<path-hash>` and is written to `.env` on the first run. Redis keys, queues and Horizon use that same project namespace. Setup never drops a database, flushes Redis, seeds users or regenerates an existing application key. Keep the directory location stable; when moving a project, reconnect its existing database manually rather than running initial setup against a different project identity.

An `incomplete` result names the failed stage and provides recovery guidance. Fix that prerequisite and rerun `bun run setup` in the same directory. `.f7t/setup-state.json` records nonsecret stage results and is ignored by Git. Every rerun checks reality rather than trusting a previous marker. A files-only generation with skipped installation is **setup pending**. `initialized` means ready to start processes, not that a browser journey has passed.

## Processes and first account

Herd serves the PHP site at `APP_URL`. For HTTPS, link and secure this directory in Herd. Keep the frontend asset process and Horizon in separate terminals:

```sh
bun run dev
php artisan horizon
```

Use `php artisan schedule:work` when developing scheduled jobs. Nightwatch has no local process and is not registered in local or testing environments.

### HTTPS through a reverse proxy

When Herd proxies a secured hostname to an HTTP `artisan serve` listener, set `APP_URL` to that public HTTPS origin and `TRUSTED_PROXIES=127.0.0.1` in `.env`. Add `::1` only if the proxy actually connects over IPv6. Keep `SESSION_SECURE_COOKIE=true` and leave `SESSION_DOMAIN` unset. Bind the private listener to loopback. Rebuild cached configuration and restart the listener after changing its environment.

`TRUSTED_PROXIES` is an explicit comma-separated IPv4/IPv6 address allowlist. Its empty default trusts no proxy. Wildcards, hostnames, CIDR ranges and `REMOTE_ADDR` are rejected. In production, list the actual TLS-terminating proxy peer addresses and restrict direct access to the backend. The proxy must preserve the public Host and overwrite `X-Forwarded-Proto` from the incoming transport. Only that scheme header is trusted; forwarded Host, port and client IP headers are ignored. `APP_URL` alone does not change the scheme of an incoming HTTP request.

All session-bearing `web` responses, including account/auth HTML, Inertia JSON, redirects and errors returned through that group, send `Cache-Control: private, no-store`. Static assets and the `/up` health route stay outside this policy. Put future cacheable public pages outside the session-bearing group. Verify HTTPS asset URLs, secure cookies and authenticated HTML cache headers at the public origin after deployment.

Create the first account independently of setup:

```sh
php artisan funnysoft:create-first-user
```

The command securely prompts for a password, creates an ordinary **unverified** account, and sends verification mail with public registration disabled. It refuses any second bootstrap account. If delivery fails after account creation, sign in and resend from `/email/verify`; rerunning setup does not create another user.

## Retrieve verification and reset mail

Open **Herd → Mail**, then select the `__F7T_APP_NAME__` mailbox. `MAIL_USERNAME=__F7T_APP_NAME__` groups this application's messages under that name. Search for the recipient you entered in the first-user command and open **Verify your email address**. Use the link, sign in and complete verification. To test recovery, request a reset at `/forgot-password`, then open **Reset your password** in the same mailbox. Resend is not involved locally.

If nothing appears, check Herd Pro's Mail service, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=2525`, `MAIL_MAILER=smtp` and `MAIL_USERNAME`. Verification and reset notifications are sent synchronously, so they do not depend on Horizon. Herd stores captured mail in `~/Library/Application Support/Herd/HerdCoreData.sqlite`; the Mail viewer is the supported day-to-day retrieval path.

## Service activation

- **Resend:** the PHP SDK and mail transport are installed. Verify your sender domain, set `RESEND_API_KEY`, `MAIL_MAILER=resend` and a verified `MAIL_FROM_ADDRESS` in production. Keep local SMTP settings locally.
- **Nightwatch:** the package is installed but undiscovered and unregistered while disabled. In production, set a project `NIGHTWATCH_TOKEN` and `NIGHTWATCH_ENABLED=true`. Run `php artisan nightwatch:agent` as its own supervised process after activation.
- **PostHog:** set `VITE_POSTHOG_ENABLED=true`, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`, then rebuild. App bootstrap initializes the SDK and captures `app_loaded` without form values. Use `analytics.capture('product_event')` for additional deliberate events. Disabled or unconfigured analytics never initializes the SDK or sends provider traffic. Automatic capture, page views, page leave, person profiles and session recording are off. URL, path and referrer properties are excluded because account links contain secrets. Do not send account secrets as events.
- **Turnstile:** set `TURNSTILE_ENABLED=true` and rebuild (the example derives `VITE_TURNSTILE_ENABLED` from it). Registration and reset-link forms automatically load Cloudflare's widget and send `turnstile_token`. Laravel rejects missing, invalid, expired or failed-verification tokens on `POST /register` and `POST /forgot-password`. Each submission consumes the token and remounts the challenge after success or failure; mutations are never retried automatically. Login, password replacement and authenticated account operations do not require CAPTCHA. Public registration still requires `FUNNYSOFT_REGISTRATION_ENABLED=true`. Local development uses the example's official always-pass dummy pair and live Siteverify, requiring internet access. CI fakes success, rejection and network failures at the route boundary. Before production, set real matching `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY`; backend boot and frontend mount reject missing/dummy production credentials. Never log tokens or secrets. Provisioning stays independent of CAPTCHA.

Disabled Turnstile loads no widget and performs no Siteverify requests. Clear/rebuild Laravel configuration caches after changing provider settings.

## Production processes

Provision Laravel Cloud compute, PostgreSQL and Valkey in Frankfurt manually. Configure HTTPS, the app key, provider credentials and dedicated queue/session connections. Run quality checks before the serialized deployment, apply migrations, rebuild configuration/routes and restart Horizon after each deployment. Supervise Horizon, the scheduler and, once enabled, Nightwatch. Cloud account connection and deployment are not part of local setup.

Run `bun run check` for the generated standards gates. Use a dedicated test database before running PHP tests, which reset their test schema.
