# F7T stack

Project instructions live in root `AGENTS.md`. Read it first. Prefer it over this file when they differ.

## Runtime

- Package manager and scripts: **bun** only (`bun install`, `bun run`, `bunx`).
- Do not add npm/yarn/pnpm lockfiles or scripts that assume Node's npm CLI.

## Imports and paths

- Use the `~/*` alias for `src/*` imports.
- Prefer `~/lib/...`, `~/components/...`, `~/server/...` over deep relative paths.

## API surface

- Server endpoints are Next.js **Route Handlers** under `src/app/api/**/route.ts`.
- Validate request bodies and query params with **Zod**.
- Return typed JSON. Keep handlers thin; put shared logic under `src/server/` or `src/lib/`.
- **No tRPC.** Do not add `@trpc/*`, routers, or procedure clients.

## Agent behavior

- Follow `AGENTS.md` for stack list, commands, layout, and do-nots.
- Do not invent a second source of truth in `.grok/`.
- No `.claude/` harness in this project.
