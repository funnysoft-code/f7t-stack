---
description: Laravel agent layer. Boost, Herd, and backend conventions.
globs: services/api/app/**,services/api/routes/**,services/api/config/**,services/api/database/**,services/api/tests/**,services/api/Modules/**
alwaysApply: false
---

# Laravel

Laravel lives in the app tree that owns `services/api/artisan`. OpenCode is the laptop process harness. Laravel Boost is the Laravel agent layer.

- Read the Laravel app `AGENTS.md` when it exists. Use Boost skills under `.opencode/skills` for PHP work.
- Run `composer` and Artisan on the laptop through Herd (`herd composer`, `herd php artisan`). Do not use Sail. Cursor Cloud is out.
- Follow product backend pillars (`docs/04-backend.md` when present). Do not contradict the playbook.
- Do not overwrite root `AGENTS.md`. Boost lines stay in the Laravel app tree.
- Repo-root MCP starts Boost with `php` and `services/api/artisan boost:mcp` in `opencode.json`. Do not set a working directory on that command.
