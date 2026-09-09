# Laravel foundation provenance

The framework entry points and application layout are adapted from the official `laravel/laravel` skeleton at immutable commit `aa0cf127fc365a56ee016867144ddffabc2290ae`, retrieved from GitHub's public repository API on 2026-09-08.

Source: https://github.com/laravel/laravel/tree/aa0cf127fc365a56ee016867144ddffabc2290ae

The template owns its PostgreSQL-only configuration, UUID v7 user model, policies, permissions migrations, queue tables, Redis isolation, Horizon authorization, tests and non-visible Inertia runtime. No product repository was copied. Fortify, Horizon, Essentials, Spatie and Inertia are installed from public Composer packages. Their exact distributions and upstream references are recorded in `composer.lock`; frontend distributions are recorded in `bun.lock`.

The Composer project name stays `funnysoft/inertia` across generated applications because the root name participates in Composer's lock content hash. Application naming belongs to environment and application configuration. The lock hash was refreshed in the installed U5 fixture without changing the dependency graph, then validated against two differently named generated applications.

Laravel skeleton copyright Taylor Otwell, MIT license. See `LICENSE`. Package authors retain the licenses shipped with their installed distributions. Dependency source trees and archives are not distributed in this template.

The generated project records its independently pinned standards identity when stamped. The U5 development fixture used standards commit `8f3d7d67841c2ba094813c75697446068e6c3767`; this is fixture evidence, not a generator release declaration.
