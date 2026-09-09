# U14 trusted proxy and response cache fix

Date: 2026-09-09. This is bounded fix verification, not the final packed release rerun.

## Fixture isolation

Copied the original installed `fixture-192` and `fixture-193` into `u14-proxy-inertia` and `u14-proxy-api` beneath `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode`. The original fixtures were not edited. These copies retain the old packed frontend build and standards v0.3.0, with only this worker's backend changes and tests overlaid.

Created separate PostgreSQL databases `u14_proxy_inertia_live`, `u14_proxy_api_live`, `u14_proxy_inertia_test` and `u14_proxy_api_test`. Runtime Redis prefixes, queue names and Horizon prefixes use `u14_proxy_inertia` or `u14_proxy_api`. Existing keys were preserved. Each live database received one owned, verified account for this focused check. This did not repeat first-user provisioning or verification mail.

Used the already approved secured Herd proxies, Inertia on port 8054 and Next on 3054, with its private API on 8055. No Herd, DNS, certificate or global service configuration changed. PHP and Next request output went to `/dev/null`.

## Cause and fix

Herd terminated TLS and sent the request to Laravel over HTTP. A temporary, restricted probe in the copied Inertia public directory observed `REMOTE_ADDR=127.0.0.1`, `Host=u14-packed-inertia.test`, `X-Forwarded-Proto=https`, no forwarded port and backend port 8054. The probe was removed.

Without proxy trust, Laravel treated the request as HTTP. Request-derived Vite URLs therefore used HTTP even though `APP_URL` was HTTPS. Trusted Chrome reproduced HTTP 200, 30 insecure script/link references and an empty body. `config/essentials.php` only forces HTTPS in production, so it did not repair this local proxy path.

Both Laravel variants now load `config/trustedproxy.php`. `TRUSTED_PROXIES` is an empty-by-default, explicit IPv4/IPv6 address allowlist. Invalid entries, including wildcards, CIDR ranges, hostnames and `REMOTE_ADDR`, fail configuration loading. Both bootstraps trust only `X-Forwarded-Proto`. Forwarded Host, port and client IP remain untrusted. For this approved Herd setup, the Inertia listener started with `TRUSTED_PROXIES=127.0.0.1`. The direct API listener needed no proxy trust.

Inertia web responses previously returned `no-cache, private`, which permits storage with revalidation. `PreventSessionResponseCaching` now wraps its session-bearing web group and sets `private, no-store`, including account/auth HTML and Inertia JSON. The health endpoint and static assets remain outside the policy.

Next needed no server code change. Its production dynamic response policy already includes `private` and `no-store`. The earlier `no-cache, must-revalidate` observation came from development Next. The installed Next `dist/server/base-server.js` contains that development override. Current Next documentation also identifies private no-store as the production dynamic-page policy. The generated README documents explicit development-host startup and production-mode cache verification.

Documentation consulted through Context7:

- Laravel 13 `requests.md`, configuring explicit trusted proxy addresses and trusted header masks.
- Next self-hosting and CDN caching guides, dynamic response cache headers.

## Regression tests and PHP gates

Before the implementation, both proxy suites failed on the trusted peer's HTTPS assertion. Inertia's HTML test failed with actual `no-cache, private` versus required `no-store, private`.

After the fix, both suites prove trusted IPv4/IPv6 scheme handling, rejection of an untrusted caller's spoofed scheme, no trust by default, ignored forwarded Host and invalid catch-all configuration. Inertia tests also assert login/profile HTML no-store and an unaffected health endpoint.

Commands from the respective copied PHP roots:

```sh
DB_DATABASE=u14_proxy_inertia_test herd php vendor/bin/pest tests/Feature/TrustedProxyTest.php tests/Http/Users/AccountPagesTest.php
DB_DATABASE=u14_proxy_api_test herd php vendor/bin/pest tests/Feature/TrustedProxyTest.php
herd php vendor/bin/phpstan analyse --level=max --memory-limit=2G --no-progress
```

The targeted runs passed 24 tests / 95 assertions for Inertia and 10 / 18 for API. Full suites passed 111 tests / 916 assertions and 116 / 931 respectively. Full PHPStan max-level checks passed in both.

From each copied workspace root, the generated gates also passed:

```sh
bash scripts/php-gate.sh pint
bash scripts/php-gate.sh rector
# Set the matching dedicated test database for each workspace.
DB_DATABASE=u14_proxy_inertia_test bash scripts/php-gate.sh pest
DB_DATABASE=u14_proxy_api_test bash scripts/php-gate.sh pest
```

Pint checked 92 Inertia files and 99 API files. Rector had no changes. Both generated Pest gates reported 100% coverage and 100% type coverage for their configured source lists. These are the copied v0.3.0 gates, not proof of the coordinator's future v0.3.1 packed matrix.

## Chrome and production HTML evidence

System Chrome 152 used a dedicated profile and CDP port 9274 through `dev-browser`. No certificate bypass or browser security override was used. Next ran with `bun run start --port 3054`, using the copied production build. PHP used `artisan serve --no-reload` on the ports above.

| Check                              | Observed result                                                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inertia HTTPS login                | HTTP 200, TLS 1.3, issuer `Laravel Valet CA Self Signed CN`, exact host certificate, secure context, visible Sign in heading and zero insecure script/link references |
| Inertia profile HTML               | Authenticated HTTP 200, `Cache-Control: no-store, private`, owned account name in the HTML                                                                            |
| Next production login/profile HTML | HTTP 200, `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; profile HTML contained the owned account name                                     |
| Secure cookies                     | Both hosts had host-only, root-path, SameSite=Lax Secure session and XSRF cookies; session cookies were HttpOnly                                                      |
| Actual profile edits               | Real UI PATCH succeeded with 204 for Inertia and 200 for API; a fresh navigation showed each updated name                                                             |
| CSRF rejection                     | API invalid token returned 419; Inertia token fallback without Fetch Metadata returned 419 and `no-store, private`                                                    |
| API and Horizon policy             | `/api/auth/me` returned 200, native Horizon and stats returned 403 for the ordinary user; all retained `private, no-store`                                            |
| Static assets                      | Inertia asset HTTP 200 with no added cache policy; Next hashed asset HTTP 200 with `public, max-age=31536000, immutable`                                              |

Laravel 13's native request-forgery middleware accepts browser `Sec-Fetch-Site: same-origin` as proof before comparing tokens. A same-origin browser request with an invalid token therefore reached the account confirmation boundary and returned 423, not a CSRF rejection. The separate fallback check used the current browser session privately, omitted Fetch Metadata and supplied an invalid token; it returned 419. No middleware was weakened. Passwords and cookies were transferred through private temporary files and never printed.

The rendered login screenshot was inspected at `~/.dev-browser/tmp/u14-proxy-inertia-login.png`. It contains no credentials. No frontend form changes were included in this verification.

## Cleanup and required rerun

Both owned accounts signed out through the UI and were deleted from their dedicated databases. Final checks found zero users, passkeys and password-reset tokens in both live databases. Owned PHP, Next and Chrome processes stopped. Private credential/cookie files and the dedicated Chrome profile were removed. The copied fixtures, dedicated databases and safe screenshot remain. Original fixtures and approved Herd proxies remain intact.

The coordinator must still regenerate inventory, repack all reviewed changes with the intended standards release, record the new artifact identity and repeat the full packed HTTPS gate. Include fresh Inertia account/security and signed-link journeys, native pre-hydration form safety, genuine passkey/TOTP flows, session-ID rotation, independent SSR identities, protected HTML caching and native Horizon permission transitions. This focused fix does not establish a deployed preview or replace those package-level checks.

## Fresh-candidate test isolation correction

Follow-up on source HEAD `abbf4bc`, after the proxy/cache patch `e87f4be`. The fresh v0.3.1 candidate exposed two defects in the tests, not in production proxy or cache handling.

The earlier copied fixtures predated the `TRUSTED_PROXIES=` example entry. Fresh generated `.env` files contain it. Laravel's environment repository reads multiple adapters, and dotenv records which keys it loaded. Changing only `$_ENV` neither replaced the other adapters' empty values nor prevented a subsequent application refresh from reloading that key. Two trusted-peer cases and six invalid-entry cases therefore missed their intended environment override in each stack.

The HTML cache test also rendered Vite tags without disabling the asset integration. A clean pre-build checkout has no manifest, so the request returned 500 before the cache assertion. This test checks HTTP cache headers, not compiled assets.

Only these source tests changed:

- Both `tests/Feature/TrustedProxyTest.php` files now use a scoped helper modeled on `RegistrationRouteCacheTest`. It snapshots `$_ENV`, `$_SERVER` and the process environment, clears dotenv's loaded-key marker, sets every adapter and restores all prior values in `finally`. Assertions verify restoration. Trusted requests still refresh the real application; invalid values still run the real configuration parser.
- Inertia `tests/Http/Users/AccountPagesTest.php` calls `withoutVite()` only in the HTML cache test. Its response and header assertions are unchanged.

### Reproduction and full checks

Used the authorized fresh fixtures under:

```text
/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/u14-release-031-final/packed
```

Created isolated test databases `f7t_u14_proxy_regression_inertia_test` and `f7t_u14_proxy_regression_api_test`. The route worker's databases and live data were not used. Commands inherited the matching test database, dedicated Redis prefix/queue/Horizon namespace and `REDIS_PORT=6379`. Fixture `.env` files and application keys stayed byte-identical.

For both red and green checks, temporarily renamed the Inertia manifest with restoration in `finally`. Its restored SHA-256 matched the original. The complete Inertia PHP gate also ran with the manifest absent.

| Check                                                              | Inertia                    | API                        |
| ------------------------------------------------------------------ | -------------------------- | -------------------------- |
| Original targeted tests, generated `.env`, absent Inertia manifest | 9 failed, 15 passed        | 8 failed, 2 passed         |
| Corrected targeted tests, same conditions                          | 24 passed, 125 assertions  | 10 passed, 48 assertions   |
| Full `bun run check:php`                                           | 115 passed, 968 assertions | 117 passed, 967 assertions |
| Pint / PHPStan max / Rector                                        | All passed                 | All passed                 |
| Configured source coverage / type coverage                         | 100% / 100%                | 100% / 100%                |
| Additional proxy run with external `TRUSTED_PROXIES=192.0.2.123`   | 10 passed, 48 assertions   | 10 passed, 48 assertions   |

The extra external-environment runs verify restoration of a nonempty preexisting value despite the empty generated dotenv entry. No configuration-cache test was added. No browser rerun was needed for these test-only corrections.

Commands from each fixture workspace root, after exporting the matching isolated database and Redis settings:

```sh
# Inertia, with public/build/manifest.json temporarily absent:
herd php vendor/bin/pest --compact tests/Feature/TrustedProxyTest.php tests/Http/Users/AccountPagesTest.php
bun run check:php

# API targeted tests run from services/api; the full gate runs from its workspace root:
herd php vendor/bin/pest --compact tests/Feature/TrustedProxyTest.php
bun run check:php
```

### Source identity and retained evidence

The three overlaid fixture tests are byte-identical to the source files. Both proxy tests have SHA-256 `d4c5a941ff1d54be3d17383395830a2af3526f7f1efd57c5b15ff128e6f4438f`. The Inertia account-page test has SHA-256 `07b636f4573b5c52aa249ad53361a189d61e1bc18118a95ef65f7d47f632c01e`.

Logs in `u14-release-031-final`:

```text
inertia-proxy-regression-red.log
api-proxy-regression-red.log
inertia-proxy-regression-green.log
api-proxy-regression-green.log
inertia-proxy-regression-full-php.log
api-proxy-regression-full-php.log
inertia-proxy-regression-external-env.log
api-proxy-regression-external-env.log
proxy-regression-source-identity.json
```

The manifest is restored and no temporary backup remains. No runtime servers were started, no global Redis flush occurred, and no production source, package inventory, lockfile or Git lifecycle operation changed in this correction. The dedicated test databases and test overlays remain for coordinator use. The coordinator still owns review, inventory refresh and a newly packed artifact; these results prove the overlaid source tests, not a repacked tarball.
