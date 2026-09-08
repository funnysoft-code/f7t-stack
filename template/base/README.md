# `__F7T_APP_NAME__`

## Local setup

Install Bun >=1.4, then run `bun run setup`. It installs the committed lockfile with `--frozen-lockfile`, preserves existing `.env` and `.env.local` files, and initializes the selected database through the generated Drizzle scripts when present. SQLite uses the configured local file. For PostgreSQL, start the generated `docker compose up -d` service or configure `DATABASE_URL` for an existing dedicated database before rerunning setup. Setup does not provision cloud databases.

An `incomplete` result names the failed stage and directs you back to `bun run setup`. The ignored `.f7t/setup-state.json` records nonsecret results. Reruns recheck actual prerequisites and run incremental migrations; they do not reset your schema or replace your application choices. A generation with skipped setup is not locally ready.

If you selected Sanity, connect your project and dataset in `.env`, then run `bun run typegen`. If you selected Resend, configure a verified sender and API key. These external connections are reported as manual pending steps, not silently considered configured. Keep credentials out of source control.

After initialization, run `bun run dev` and verify the application in your browser. `initialized` means ready to start, not already running or browser-verified. Run `bun run check` for the generated quality gates. If browser tests are included, install their browser with `bunx playwright install`.

Connect the project to Vercel and set its production environment variables manually. Local setup does not deploy or provision external resources.
