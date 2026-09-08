# Foundation provenance

Laravel application entry points and configuration are adapted from
`laravel/laravel` commit `aa0cf127fc365a56ee016867144ddffabc2290ae`, the public
Laravel 13 skeleton, retrieved on 2026-09-08. Source:
https://github.com/laravel/laravel/tree/aa0cf127fc365a56ee016867144ddffabc2290ae

The skeleton is MIT licensed, copyright Taylor Otwell. Its license is retained
in `services/api/LICENSE.laravel`. Configuration is reduced to PostgreSQL,
Redis, and local mail. Identity is an authored nwidart module. No product
application directory is used as the initial tree.

The Next workspace uses the pinned Next/React versions from f7t-stack's own
standalone Next template. The health route and workspace entry points are
authored here. API transport and generated OpenAPI contracts follow in U16.

Private Scramble Pro remains an installed dependency. No private source or
dependency archive is redistributed in this template.

The Composer project name stays `funnysoft/api` so app-name substitution does
not invalidate Composer's dependency content hash. The generated application's
name is configured separately in `config/app.php` and its environment.
