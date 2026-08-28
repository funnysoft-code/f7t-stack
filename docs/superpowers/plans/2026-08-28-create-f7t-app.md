# create-f7t-app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `bunx create-f7t-app` that copies a bun Next.js base and optional extras, matching the spec.

**Architecture:** Single package. Pure `parseArgv` / `resolveConfig` plus `createApp(config)` that copies `template/base`, runs extra installers in spec order, then rewrites `src/env.js` and `AGENTS.md`. Templates are files on disk. Installer code is generic copy-plus-manifest, with a few extras that pick a folder or destination.

**Tech Stack:** bun 1.4.0, TypeScript 7.0.2, commander 15.0.0, `@clack/prompts` 1.7.0, vitest 4.1.11. Generated apps: Next 16.3.3, React 19.2.8, Tailwind 4.3.3, oxlint 1.80.0, oxfmt 0.65.0.

**Spec:** `docs/superpowers/specs/2026-08-28-create-f7t-app-design.md`

## Global Constraints

- bun only. No npm/pnpm/yarn prompt. `packageManager` is `bun@1.4.0`.
- Generated apps: Next `16.3.3`, React `19.2.8`, React DOM `19.2.8`, Tailwind `4.3.3`, `@tailwindcss/postcss` `4.3.3`, TypeScript `7.0.2`, oxlint `1.80.0`, oxfmt `0.65.0`, vitest `4.1.11`, `@t3-oss/env-nextjs` `0.13.11`, zod `4.4.3`.
- `bun run check` = `oxlint . && oxfmt --check . && tsc --noEmit && vitest run && bunx react-doctor@0.9.12 . --no-telemetry -y`.
- Import alias always `~/*` → `src/*`. `src/` directory. App Router.
- No tRPC, Auth, Prisma, Laravel, Expo, telemetry, sample `Post` table.
- Data is mutually exclusive: none | sanity | drizzle. Drizzle without `--db` is sqlite.
- Installer order: data → intl → shell → shadcn → resend → playwright → harness → github-actions → write env → write AGENTS.md → git → bun install.
- `--CI` equals `--yes` with no spinners. `--skip-install` is test-only, not in the wizard.
- Target dir is `cwd/<app-name>`. Abort if non-empty unless `--force`.
- Contact path: `/contacto` only when intl is off and locale is `pt-PT`. Otherwise `/contact`.
- next-intl: default locale `en`, `localePrefix: 'as-needed'`. Studio and `src/app/api` stay unprefixed.
- Shells never import shadcn `Button`. They work with or without that extra.
- Conventional Commits. One logical change per task commit.
- Never print secrets. Placeholder env values only.

---

## File map

| Path | Responsibility |
| --- | --- |
| `package.json` | CLI package `create-f7t-app`, bin, files, scripts |
| `cli/src/index.ts` | commander + clack + `createApp` |
| `cli/src/config.ts` | `FlagInput`, `CreateConfig`, `parseArgv`, `resolveConfig`, `YES_DEFAULTS` |
| `cli/src/paths.ts` | `packageRoot()`, `templateDir()`, `appPagesRoot(config)` |
| `cli/src/fs.ts` | copy dir, merge package.json, replace `__F7T_*__` |
| `cli/src/create-app.ts` | orchestration |
| `cli/src/installers.ts` | ordered installers, extra manifests |
| `cli/src/env-file.ts` | rewrite `src/env.js` + `.env.example` + `.env` |
| `cli/src/agents.ts` | rewrite `AGENTS.md` |
| `cli/src/prompts.ts` | clack wizard |
| `cli/src/git.ts` | `git init` |
| `cli/src/install.ts` | `bun install` |
| `cli/src/next-steps.ts` | stdout after generate |
| `cli/src/test-helpers.ts` | temp dir generate for tests |
| `template/base/**` | always-on Next app |
| `template/extras/<name>/**` | extra files + `extra.json` manifest |
| `cli/src/*.test.ts` | unit + fixture tests |
| `README.md` `LICENSE` `.github/workflows/ci.yml` | publish + this-repo CI |

`extra.json` shape:

```ts
export type ExtraManifest = {
  package?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  env?: Array<{
    key: string;
    side: "server" | "client";
    zod: string;
    example: string;
  }>;
  agents?: string;
};
```

Files under an extra folder (except `extra.json`) copy onto the project root. Shell extras copy relative to `appPagesRoot(config)` for files under `__app__/`.

---

### Task 1: Flag parser

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `cli/src/config.ts`
- Test: `cli/src/config.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `parseArgv(argv: string[]): FlagInput`, `resolveConfig(input: FlagInput, cwd?: string): CreateConfig`, types `CreateConfig`, `FlagInput`, `Shell`, `Data`, `Db`, `Harness`, `Locale`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { parseArgv, resolveConfig } from "./config";

describe("parseArgv", () => {
  test("reads positional name and long flags", () => {
    const input = parseArgv([
      "shop",
      "--shell",
      "app",
      "--data",
      "drizzle",
      "--db",
      "postgres",
      "--shadcn",
      "--playwright",
      "--resend",
      "--intl",
      "--harness",
      "both",
      "--no-github-actions",
      "--no-git",
      "--skip-install",
      "--force",
    ]);
    expect(input.appName).toBe("shop");
    expect(input.shell).toBe("app");
    expect(input.data).toBe("drizzle");
    expect(input.db).toBe("postgres");
    expect(input.shadcn).toBe(true);
    expect(input.playwright).toBe(true);
    expect(input.resend).toBe(true);
    expect(input.intl).toBe(true);
    expect(input.harness).toBe("both");
    expect(input.githubActions).toBe(false);
    expect(input.git).toBe(false);
    expect(input.skipInstall).toBe(true);
    expect(input.force).toBe(true);
  });

  test("--CI is --yes", () => {
    expect(parseArgv(["--CI"]).yes).toBe(true);
    expect(parseArgv(["--CI"]).ci).toBe(true);
  });

  test("--app-name wins over positional", () => {
    expect(parseArgv(["ignored", "--app-name", "real"]).appName).toBe("real");
  });
});

describe("resolveConfig", () => {
  test("--yes fills spec defaults", () => {
    const config = resolveConfig({ appName: "acme", yes: true }, "/tmp");
    expect(config).toMatchObject({
      appName: "acme",
      projectDir: "/tmp/acme",
      shell: "site",
      data: "none",
      db: "sqlite",
      shadcn: false,
      playwright: false,
      resend: false,
      intl: false,
      locale: "pt-PT",
      harness: "none",
      githubActions: true,
      git: true,
      skipInstall: false,
      force: false,
    });
  });

  test("drizzle without db is sqlite", () => {
    const config = resolveConfig(
      { appName: "acme", yes: true, data: "drizzle" },
      "/tmp",
    );
    expect(config.db).toBe("sqlite");
  });

  test("intl ignores --locale and uses en", () => {
    const config = resolveConfig(
      { appName: "acme", yes: true, intl: true, locale: "pt-PT" },
      "/tmp",
    );
    expect(config.intl).toBe(true);
    expect(config.locale).toBe("en");
  });

  test("--yes without appName throws", () => {
    expect(() => resolveConfig({ yes: true }, "/tmp")).toThrow(/--app-name/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/config.test.ts`

Expected: FAIL (package/vitest/module missing)

- [ ] **Step 3: Write package scaffold and parser**

`package.json`:

```json
{
  "name": "create-f7t-app",
  "version": "0.0.0",
  "description": "FunnySoft Next.js app generator",
  "license": "MIT",
  "type": "module",
  "bin": {
    "create-f7t-app": "./cli/src/index.ts"
  },
  "files": ["cli/src", "template", "README.md", "LICENSE"],
  "scripts": {
    "test": "vitest run",
    "check": "oxlint cli && oxfmt --check cli package.json tsconfig.json vitest.config.ts && tsc --noEmit && vitest run"
  },
  "engines": {
    "bun": ">=1.4.0"
  },
  "packageManager": "bun@1.4.0",
  "devDependencies": {
    "@types/node": "24.10.1",
    "oxfmt": "0.65.0",
    "oxlint": "1.80.0",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  }
}
```

`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `module` ESNext, `moduleResolution` bundler, include `cli/src`.

`vitest.config.ts`: `test: { include: ["cli/src/**/*.test.ts"] }`.

`.gitignore`: `node_modules`, `dist`, `.env`, generated test tmp if any.

Implement `cli/src/config.ts` so the tests pass. `parseArgv` walks `argv` (already without node/bun and script path). Support `--yes`, `--CI`, `--force`, `--skip-install`, `--no-git`, `--no-github-actions`, boolean extras as presence flags. Invalid `--shell` / `--data` / `--db` / `--harness` / `--locale` throw `Error` with the allowed values.

`resolveConfig`: if `yes` or `ci`, start from `YES_DEFAULTS`. Overlay provided flags. `projectDir = path.join(cwd, appName)`. If `intl`, set `locale` to `"en"`. If `data !== "drizzle"`, still set `db` to `"sqlite"` but callers ignore it.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun install && bunx vitest run cli/src/config.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore bun.lock cli/src/config.ts cli/src/config.test.ts
git commit -m "feat: parse create-f7t-app flags and --yes defaults"
```

---

### Task 2: createApp copies base into a directory

**Files:**
- Create: `cli/src/paths.ts`
- Create: `cli/src/fs.ts`
- Create: `cli/src/create-app.ts`
- Create: `cli/src/test-helpers.ts`
- Create: `template/base/README.md` (one-line placeholder, replaced in Task 3)
- Create: `template/base/package.json` (minimal `{ "name": "__F7T_APP_NAME__" }`, replaced in Task 3)
- Test: `cli/src/create-app.test.ts`

**Interfaces:**
- Consumes: `CreateConfig` from `cli/src/config.ts`
- Produces: `createApp(config: CreateConfig): Promise<void>`, `packageRoot(): string`, `templateDir(...parts: string[]): string`, `copyTemplateDir(fromAbs: string, toAbs: string, replacements: Record<string, string>): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createApp", () => {
  test("copies base and substitutes the app name", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true },
      cwd,
    );
    await createApp(config);
    const pkg = JSON.parse(
      await readFile(path.join(config.projectDir, "package.json"), "utf8"),
    );
    expect(pkg.name).toBe("shop");
    expect(config.projectDir).toBe(path.join(cwd, "shop"));
  });

  test("aborts when the directory is not empty", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    await mkdir(path.join(cwd, "shop"));
    await writeFile(path.join(cwd, "shop", "nope.txt"), "x");
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true },
      cwd,
    );
    await expect(createApp(config)).rejects.toThrow(/not empty/);
  });

  test("--force overwrites", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    await mkdir(path.join(cwd, "shop"));
    await writeFile(path.join(cwd, "shop", "nope.txt"), "x");
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true, force: true },
      cwd,
    );
    await createApp(config);
    await expect(stat(path.join(config.projectDir, "package.json"))).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/create-app.test.ts`

Expected: FAIL, `createApp` missing

- [ ] **Step 3: Implement copy + createApp (no extras yet)**

`packageRoot()` walks up from `import.meta.url` until `template/base/package.json` exists.

`copyTemplateDir` copies recursively, skips nothing except it does not copy `node_modules`. After copy, replace `__F7T_APP_NAME__`, `__F7T_LOCALE__`, `__F7T_HTML_LANG__` in text files.

`createApp` for this task: empty-dir check, `mkdir`, copy `template/base`, stop. Git and install are later tasks. If `skipInstall` is false, still skip until Task 15 (document in a comment at the end of `createApp`: install/git not wired). Do not call bun install yet.

`htmlLang(config)`: `config.intl ? "en" : config.locale`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run cli/src/create-app.test.ts cli/src/config.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/paths.ts cli/src/fs.ts cli/src/create-app.ts cli/src/create-app.test.ts template/base
git commit -m "feat: copy template/base into the target directory"
```

---

### Task 3: Real base Next template

**Files:**
- Replace: `template/base/**` with the always-on app
- Modify: `cli/src/create-app.test.ts` (assert `check` scripts and `src/app/page.tsx`)

**Interfaces:**
- Consumes: `createApp`
- Produces: a generated `--yes --skip-install` app whose `package.json` scripts include `dev`, `build`, `start`, `check`, `lint`, `fmt`, `fmt:check`, `typecheck`, `test`

- [ ] **Step 1: Extend the fixture test**

Add to `cli/src/create-app.test.ts`:

```ts
test("base template has the always-on scripts and src tree", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
  dirs.push(cwd);
  const config = resolveConfig(
    { appName: "shop", yes: true, skipInstall: true },
    cwd,
  );
  await createApp(config);
  const pkg = JSON.parse(
    await readFile(path.join(config.projectDir, "package.json"), "utf8"),
  );
  expect(pkg.scripts.check).toContain("oxlint");
  expect(pkg.scripts.check).toContain("oxfmt --check");
  expect(pkg.scripts.check).toContain("react-doctor@0.9.12");
  expect(pkg.packageManager).toBe("bun@1.4.0");
  const page = await readFile(
    path.join(config.projectDir, "src/app/page.tsx"),
    "utf8",
  );
  expect(page).toContain("shop");
  const env = await readFile(path.join(config.projectDir, "src/env.js"), "utf8");
  expect(env).toContain("NEXT_PUBLIC_SITE_URL");
  expect(env).not.toContain("DATABASE_URL");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/create-app.test.ts`

Expected: FAIL on scripts / files

- [ ] **Step 3: Write the base template**

Exact files:

`template/base/package.json`:

```json
{
  "name": "__F7T_APP_NAME__",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.4.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "oxlint .",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "oxlint . && oxfmt --check . && tsc --noEmit && vitest run && bunx react-doctor@0.9.12 . --no-telemetry -y"
  },
  "dependencies": {
    "@t3-oss/env-nextjs": "0.13.11",
    "next": "16.3.3",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "24.10.1",
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.3",
    "oxfmt": "0.65.0",
    "oxlint": "1.80.0",
    "tailwindcss": "4.3.3",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  }
}
```

If `@types/react@19.2.8` does not exist on npm, pin to the matching published types version. Do not use `latest`.

`template/base/tsconfig.json`: copy joficina shape (`strict`, `noUncheckedIndexedAccess`, `checkJs`, `~/*` → `./src/*`).

`template/base/next.config.ts`:

```ts
import "./src/env.js";
import type { NextConfig } from "next";

const config: NextConfig = {};

export default config;
```

`template/base/postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

`template/base/src/app/globals.css`:

```css
@import "tailwindcss";
```

`template/base/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "__F7T_APP_NAME__",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="__F7T_HTML_LANG__">
      <body>{children}</body>
    </html>
  );
}
```

`template/base/src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <h1>__F7T_APP_NAME__</h1>;
}
```

`template/base/src/env.js`: `@t3-oss/env-nextjs` `createEnv` with `NODE_ENV` on server and `NEXT_PUBLIC_SITE_URL` on client (`z.string().url()`), `skipValidation` via `SKIP_ENV_VALIDATION`, `emptyStringAsUndefined: true`. `.env.example` and copied `.env` set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

`template/base/vitest.config.ts`: `passWithNoTests: true`.

`template/base/.oxlintrc.json`: `{ "$schema": "./node_modules/oxlint/configuration_schema.json", "plugins": ["typescript", "react", "nextjs"] }`

`template/base/.oxfmtrc.json`: `{}` (oxfmt defaults). Run `bunx oxfmt --init` in a scratch dir if the empty object is invalid.

`template/base/.gitignore`: `.next`, `node_modules`, `.env`, `*.pem`, `tsconfig.tsbuildinfo`, `test-results`, `playwright-report`.

`template/base/AGENTS.md`: short stub. Task 14 overwrites it.

`createApp` must copy `.env.example` to `.env` when `.env` is missing.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run cli/src/create-app.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/base cli/src/create-app.test.ts
git commit -m "feat: add always-on Next.js base template"
```

---

### Task 4: Extra installer pipeline

**Files:**
- Create: `cli/src/installers.ts`
- Create: `cli/src/env-file.ts`
- Create: `cli/src/agents.ts` (stub that writes a title only, full renderer in Task 14)
- Modify: `cli/src/create-app.ts` to run installers then `writeEnv` then `writeAgents`
- Test: `cli/src/installers.test.ts`

**Interfaces:**
- Consumes: `CreateConfig`, `copyTemplateDir`, `templateDir`
- Produces: `runInstallers(config: CreateConfig): Promise<void>`, `readExtraManifest(extraName: string): ExtraManifest`, `Installer` `{ name: string; shouldRun(config: CreateConfig): boolean; run(config: CreateConfig): Promise<void> }`

- [ ] **Step 1: Write the failing test**

Put a tiny extra at `template/extras/_test_probe/` used only by this test, then delete the extra at the end of the task. Better: test `shouldRun` functions without a fake extra.

```ts
import { describe, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { installers } from "./installers";

const names = (input: Parameters<typeof resolveConfig>[0]) =>
  installers
    .filter((installer) => installer.shouldRun(resolveConfig({ appName: "x", yes: true, skipInstall: true, ...input }, "/tmp")))
    .map((installer) => installer.name);

describe("installer order and gates", () => {
  test("--yes runs shell-site and github-actions only", () => {
    expect(names({})).toEqual(["shell-site", "github-actions"]);
  });

  test("drizzle postgres + app + both harness", () => {
    expect(
      names({
        data: "drizzle",
        db: "postgres",
        shell: "app",
        harness: "both",
        githubActions: false,
      }),
    ).toEqual([
      "drizzle-postgres",
      "shell-app",
      "harness-grok",
      "harness-cursor",
    ]);
  });

  test("sanity and drizzle are mutually exclusive gates", () => {
    expect(names({ data: "sanity", githubActions: false })).toEqual([
      "sanity",
      "shell-site",
    ]);
    expect(names({ data: "drizzle", githubActions: false })).toEqual([
      "drizzle-sqlite",
      "shell-site",
    ]);
  });
});
```

Installer `name` strings must match the extra folder names in the spec.

Order of the `installers` array must be: `sanity`, `drizzle-sqlite`, `drizzle-postgres`, `next-intl`, `shell-site`, `shell-app`, `shadcn`, `resend`, `playwright`, `harness-grok`, `harness-cursor`, `github-actions`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/installers.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement installers**

Each installer: `shouldRun` from config, `run` copies `template/extras/<name>/` into the project (if the folder exists; until extras land, `run` is a no-op when the folder is missing so Task 3 tests still pass). Missing extra folders must not throw yet, or Task 4 breaks `--yes` because github-actions and shell-site do not exist. **Throw only if `shouldRun` is true and the extra folder is missing**, starting in Task 5 when those extras are added. For Task 4, `run` is `async () => {}` for every installer. Tests only cover `shouldRun` and order.

Wire `runInstallers` into `createApp` after copying base.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/installers.ts cli/src/installers.test.ts cli/src/env-file.ts cli/src/agents.ts cli/src/create-app.ts
git commit -m "feat: add extra installer order and gates"
```

---

### Task 5: Shell extras

**Files:**
- Create: `template/extras/shell-site/**`
- Create: `template/extras/shell-app/**`
- Create: `cli/src/app-root.ts` with `appPagesRoot(config): string` returning `src/app/[locale]` when `intl` else `src/app`
- Modify: `cli/src/installers.ts` `run` for shells: copy files, place `__app__/*` under `appPagesRoot`
- Modify: `cli/src/create-app.test.ts` or new `cli/src/shell.test.ts`

**Interfaces:**
- Consumes: `CreateConfig.shell`, `CreateConfig.intl`, `appPagesRoot`
- Produces: generated `src/lib/site.ts`, header/footer or app nav, replaced homepage

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function gen(flags: Parameters<typeof resolveConfig>[0]) {
  const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
  dirs.push(cwd);
  const config = resolveConfig(
    { appName: "shop", yes: true, skipInstall: true, githubActions: false, ...flags },
    cwd,
  );
  await createApp(config);
  return config.projectDir;
}

describe("shells", () => {
  test("site writes header footer and site.ts", async () => {
    const dir = await gen({ shell: "site" });
    const page = await readFile(path.join(dir, "src/app/page.tsx"), "utf8");
    expect(page).toContain("header");
    expect(page.toLowerCase()).not.toContain("congrats");
    expect(page.toLowerCase()).not.toContain("drizzle");
    const site = await readFile(path.join(dir, "src/lib/site.ts"), "utf8");
    expect(site).toContain("shop");
    expect(site).toContain("pt-PT");
  });

  test("app writes nav and main, not a dashboard of cards", async () => {
    const dir = await gen({ shell: "app" });
    const page = await readFile(path.join(dir, "src/app/page.tsx"), "utf8");
    expect(page).toContain("<main");
    expect(page.toLowerCase()).not.toContain("sidebar");
    expect(page).not.toContain("from \"~/components/ui/button\"");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/shell.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement shells**

`template/extras/shell-site/src/lib/site.ts`:

```ts
export const site = {
  name: "__F7T_APP_NAME__",
  locale: "__F7T_LOCALE__",
  nav: [{ href: "/", label: "Home" }],
} as const;
```

`template/extras/shell-site/__app__/page.tsx`: marketing header, one `<section>`, footer. Uses `site.name`. No stack list. Plain elements only.

`template/extras/shell-app/src/lib/site.ts`: same `site` object.

`template/extras/shell-app/__app__/page.tsx`: top `<nav>` with `site.name` plus `<main>`. No widget grid.

Installer `run` for a shell: copy `src/lib/site.ts` to the project, copy `__app__/page.tsx` to `{appPagesRoot}/page.tsx`. Delete the base homepage at `src/app/page.tsx` if intl is off (shell replaced it). If intl is on, Task 11 owns `[locale]`. For this task intl is off.

Implement `copyExtra(name, config, { appPrefix: true })` in `fs.ts` that maps `__app__/` → `appPagesRoot(config)`.

Make installer `run` throw if the extra directory is missing.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/shell-site template/extras/shell-app cli/src/app-root.ts cli/src/installers.ts cli/src/fs.ts cli/src/shell.test.ts
git commit -m "feat: add site and app shells"
```

---

### Task 6: Sanity extra

**Files:**
- Create: `template/extras/sanity/**`
- Test: `cli/src/sanity.test.ts`

**Interfaces:**
- Consumes: `config.data === "sanity"`
- Produces: Studio at `src/app/studio`, `siteSettings` singleton, `typegen` script, env keys

- [ ] **Step 1: Write the failing test**

```ts
test("sanity extra lands studio and not drizzle", async () => {
  const dir = await gen({ data: "sanity" });
  await expect(stat(path.join(dir, "src/app/studio/[[...tool]]/page.tsx"))).resolves.toBeTruthy();
  await expect(stat(path.join(dir, "src/server/db/schema.ts"))).rejects.toMatchObject({ code: "ENOENT" });
  const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
  expect(pkg.scripts.typegen).toContain("sanity");
  expect(pkg.dependencies["next-sanity"]).toBe("13.3.3");
});

test("none has no studio", async () => {
  const dir = await gen({});
  await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

Reuse the `gen` helper. Move `gen` to `cli/src/test-helpers.ts` in this task if not already there.

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/sanity.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement sanity extra**

Use `next-sanity@13.3.3` and `sanity` 5.x matching joficina (`^5.30.0` pinned to the current 5.x at implementation: run `npm view sanity version` and write that number). Also pin `@sanity/vision`, `styled-components@6.4.2`.

Files:

- `sanity.config.ts` at project root, `basePath: "/studio"`
- `src/app/studio/[[...tool]]/page.tsx` NextStudio
- `src/sanity/schemaTypes/siteSettings.ts` singleton (title, description). No post, blog, author.
- `src/sanity/schemaTypes/index.ts` exports that type only
- `src/sanity/lib/client.ts` `next-sanity` client
- `src/sanity/lib/queries.ts` GROQ for `siteSettings`
- `extra.json` env: `NEXT_PUBLIC_SANITY_PROJECT_ID` client `z.string().optional()`, `NEXT_PUBLIC_SANITY_DATASET` client default `"production"`, `SANITY_API_READ_TOKEN` server optional, `SANITY_REVALIDATE_SECRET` server optional
- scripts: `"typegen": "sanity schema extract && sanity typegen generate"`
- `sanity.cli.ts` and `sanity-typegen.json` as required by current Sanity 5 typegen

Do not generate a blog. Pages keep using `src/lib/site.ts` until a later consumer fetches settings. Include `src/sanity/lib/site-settings.ts` that returns the document or null so the extra is not a dead Studio.

Merge `extra.json` package deps in the sanity installer `run` via `mergePackageJson`.

Until Task 14, env keys may only live in `.env.example` appended by the installer. Append is enough for this task's tests if you assert `.env.example` contains `NEXT_PUBLIC_SANITY_PROJECT_ID`. Also merge scripts in package.json now.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/sanity cli/src/sanity.test.ts cli/src/installers.ts cli/src/fs.ts cli/src/test-helpers.ts
git commit -m "feat: add Sanity extra with siteSettings singleton"
```

---

### Task 7: Drizzle extras

**Files:**
- Create: `template/extras/drizzle-sqlite/**`
- Create: `template/extras/drizzle-postgres/**`
- Test: `cli/src/drizzle.test.ts`

**Interfaces:**
- Consumes: `config.data === "drizzle"`, `config.db`
- Produces: `src/server/db/schema.ts` (no Post), `src/server/db/index.ts`, `drizzle.config.ts`, db scripts. Postgres also `compose.yaml`.

- [ ] **Step 1: Write the failing test**

```ts
test("sqlite has no compose and no Post table", async () => {
  const dir = await gen({ data: "drizzle" });
  const schema = await readFile(path.join(dir, "src/server/db/schema.ts"), "utf8");
  expect(schema.toLowerCase()).not.toContain("post");
  await expect(stat(path.join(dir, "compose.yaml"))).rejects.toMatchObject({ code: "ENOENT" });
  const example = await readFile(path.join(dir, ".env.example"), "utf8");
  expect(example).toContain("file:./dev.db");
  const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["db:migrate"]).toBeDefined();
});

test("postgres adds compose and a postgres URL", async () => {
  const dir = await gen({ data: "drizzle", db: "postgres" });
  const compose = await readFile(path.join(dir, "compose.yaml"), "utf8");
  expect(compose).toContain("postgres");
  const example = await readFile(path.join(dir, ".env.example"), "utf8");
  expect(example).toContain("postgres://");
  await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/drizzle.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement drizzle extras**

Pins: `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`. SQLite uses bun sqlite driver (`drizzle-orm/bun-sqlite`). Postgres uses `postgres@3.4.9` and `drizzle-orm/postgres-js`.

`schema.ts`:

```ts
// Schema lives here. No sample tables.
```

Empty module is valid. If drizzle-kit requires an export, export `export const schema = {}`.

`index.ts` creates the client from `process.env.DATABASE_URL` (env.js gains the key in Task 14; for now put `DATABASE_URL` in `.env.example` and a comment in `index.ts`).

Scripts: `db:generate`, `db:migrate`, `db:studio`.

Postgres `compose.yaml`: official `postgres:16` image, port 5432, user/password/db `app`. `.env.example` URL `postgres://app:app@localhost:5432/app`.

No sample API route.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/drizzle-sqlite template/extras/drizzle-postgres cli/src/drizzle.test.ts cli/src/installers.ts
git commit -m "feat: add Drizzle sqlite and postgres extras"
```

---

### Task 8: ShadCN extra (Base UI, vendored)

**Files:**
- Create: `template/extras/shadcn/**`
- Test: `cli/src/shadcn.test.ts`

**Interfaces:**
- Consumes: `config.shadcn`
- Produces: `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, Tailwind tokens in `globals.css`

- [ ] **Step 1: Write the failing test**

```ts
test("shadcn extra vendors button and not radix", async () => {
  const dir = await gen({ shadcn: true });
  const button = await readFile(path.join(dir, "src/components/ui/button.tsx"), "utf8");
  expect(button).toContain("@base-ui/react");
  expect(button).not.toContain("@radix-ui");
  const json = JSON.parse(await readFile(path.join(dir, "components.json"), "utf8"));
  expect(json.aliases.utils).toContain("~/lib/utils");
});

test("off means no components.json", async () => {
  const dir = await gen({});
  await expect(stat(path.join(dir, "components.json"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/shadcn.test.ts`

Expected: FAIL

- [ ] **Step 3: Vendor files**

In a scratch dir, run `bunx shadcn@latest init` with Base UI (pass `--base base` or the current flag from `bunx shadcn@latest init --help`). Add `button`. Copy `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, and the CSS variable block into `template/extras/shadcn`. Rewrite aliases from `@/` to `~/`. The generator must not call shadcn at generate time.

Pins go in `extra.json` (`clsx@2.1.1`, `tailwind-merge@3.6.0`, `class-variance-authority@0.7.1`, plus `@base-ui/react` at the version shadcn installed).

Installer appends the CSS variables to `src/app/globals.css` if they are not already present (idempotent string includes check).

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/shadcn cli/src/shadcn.test.ts cli/src/installers.ts
git commit -m "feat: add vendored shadcn extra on Base UI"
```

---

### Task 9: Playwright extra

**Files:**
- Create: `template/extras/playwright/**`
- Test: `cli/src/playwright.test.ts`

**Interfaces:**
- Consumes: `config.playwright`
- Produces: `playwright.config.ts`, `e2e/smoke.spec.ts` visiting `/`, script `test:e2e`

- [ ] **Step 1: Write the failing test**

```ts
test("playwright extra adds a / smoke spec", async () => {
  const dir = await gen({ playwright: true });
  const spec = await readFile(path.join(dir, "e2e/smoke.spec.ts"), "utf8");
  expect(spec).toContain("goto(\"/\")");
  const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["test:e2e"]).toBe("playwright test");
  expect(pkg.devDependencies["@playwright/test"]).toBe("1.62.1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/playwright.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

`playwright.config.ts` uses `@playwright/test`, `webServer` command `bun run dev`, url `http://localhost:3000`, `testDir: "./e2e"`. Smoke spec `test("home", async ({ page }) => { await page.goto("/"); await expect(page.locator("body")).toBeVisible(); })`. Do not run `playwright install` in the generator.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/playwright cli/src/playwright.test.ts cli/src/installers.ts
git commit -m "feat: add Playwright extra with a / smoke spec"
```

---

### Task 10: Resend extra

**Files:**
- Create: `template/extras/resend/**`
- Modify: `cli/src/installers.ts` (contact path)
- Test: `cli/src/resend.test.ts`

**Interfaces:**
- Consumes: `config.resend`, `config.intl`, `config.locale`
- Produces: `POST /api/contact`, page at `/contacto` or `/contact`

- [ ] **Step 1: Write the failing test**

```ts
test("pt-PT without intl uses /contacto", async () => {
  const dir = await gen({ resend: true, locale: "pt-PT" });
  await expect(stat(path.join(dir, "src/app/contacto/page.tsx"))).resolves.toBeTruthy();
  await expect(stat(path.join(dir, "src/app/contact/page.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
  const route = await readFile(path.join(dir, "src/app/api/contact/route.ts"), "utf8");
  expect(route).toContain("Resend");
  expect(route).not.toContain("@trpc");
});

test("en uses /contact", async () => {
  const dir = await gen({ resend: true, locale: "en" });
  await expect(stat(path.join(dir, "src/app/contact/page.tsx"))).resolves.toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/resend.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

`src/app/api/contact/route.ts`: `POST`, parse JSON with zod (`name`, `email`, `message`), send via `resend@6.24.0`. If `RESEND_API_KEY` is missing, return 503 with a generic message. Never log the body in production.

Page: client form posting to `/api/contact`. Place under `appPagesRoot` + `contacto` or `contact`.

`contactPath(config)`: `!config.intl && config.locale === "pt-PT" ? "contacto" : "contact"`.

Env example: `RESEND_API_KEY=`, `CONTACT_TO_EMAIL=`.

No Drizzle writes.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/resend cli/src/resend.test.ts cli/src/installers.ts
git commit -m "feat: add Resend contact extra"
```

---

### Task 11: next-intl extra

**Files:**
- Create: `template/extras/next-intl/**`
- Modify: shell/resend installers to use `appPagesRoot`
- Test: `cli/src/intl.test.ts`

**Interfaces:**
- Consumes: `config.intl`
- Produces: `src/app/[locale]/`, `src/i18n/routing.ts`, `request.ts`, `messages/en.json`, `messages/pt-PT.json`, root layout pass-through. Studio and `api` stay outside `[locale]`.

- [ ] **Step 1: Write the failing test**

```ts
test("intl moves the shell under [locale] and keeps api at root", async () => {
  const dir = await gen({ intl: true, resend: true });
  await expect(stat(path.join(dir, "src/app/[locale]/page.tsx"))).resolves.toBeTruthy();
  await expect(stat(path.join(dir, "src/app/page.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
  await expect(stat(path.join(dir, "src/app/api/contact/route.ts"))).resolves.toBeTruthy();
  const routing = await readFile(path.join(dir, "src/i18n/routing.ts"), "utf8");
  expect(routing).toContain("localePrefix");
  expect(routing).toContain("as-needed");
  expect(routing).toContain("pt-PT");
});

test("intl plus sanity keeps studio unprefixed", async () => {
  const dir = await gen({ intl: true, data: "sanity" });
  await expect(stat(path.join(dir, "src/app/studio/[[...tool]]/page.tsx"))).resolves.toBeTruthy();
  await expect(stat(path.join(dir, "src/app/[locale]/studio"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/intl.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

Pin `next-intl@4.14.1`.

`src/i18n/routing.ts`: locales `en` | `pt-PT`, default `en`, `localePrefix: "as-needed"`.

`src/i18n/request.ts`: `getRequestConfig`.

Root `src/app/layout.tsx` becomes `{children}` only (no `<html>`). `[locale]/layout.tsx` has `<html lang={locale}>`. Follow current next-intl App Router docs at implementation (`npx ctx7@latest library "next-intl"` then `docs`). If the tree rewrite is not clean, stop and cut this extra from v1 rather than ship a broken `[locale]`. That cut is a spec-allowed abort: delete the extra, skip remaining intl steps, note it in the README, do not leave half the files.

Middleware / `proxy.ts`: use whatever Next 16.3 + next-intl 4 require (`src/proxy.ts` if that replaced `middleware.ts`).

Installer order already runs intl before shell. Intl `run` must: write i18n files, replace root layout, create `[locale]` directory, remove `src/app/page.tsx` so the shell does not leave a duplicate home.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS (or extra removed with tests updated to assert it is absent, plus a README sentence)

- [ ] **Step 5: Commit**

```bash
git add template/extras/next-intl cli/src/intl.test.ts cli/src/installers.ts cli/src/app-root.ts
git commit -m "feat: add next-intl extra with as-needed locale prefix"
```

If cut: `git commit -m "docs: defer next-intl extra after app-tree rewrite failed"`

---

### Task 12: Harness extras

**Files:**
- Create: `template/extras/harness-grok/**`
- Create: `template/extras/harness-cursor/**`
- Test: `cli/src/harness.test.ts`

**Interfaces:**
- Consumes: `config.harness`
- Produces: `.grok/` and/or `.cursor/rules/` pointing at `AGENTS.md`. No `.claude/`.

- [ ] **Step 1: Write the failing test**

```ts
test("none writes no harness trees", async () => {
  const dir = await gen({ harness: "none" });
  await expect(stat(path.join(dir, ".grok"))).rejects.toMatchObject({ code: "ENOENT" });
  await expect(stat(path.join(dir, ".cursor"))).rejects.toMatchObject({ code: "ENOENT" });
});

test("both writes thin grok and cursor trees", async () => {
  const dir = await gen({ harness: "both" });
  const grok = await readFile(path.join(dir, ".grok/rules/stack.md"), "utf8");
  expect(grok).toContain("AGENTS.md");
  const cursor = await readFile(path.join(dir, ".cursor/rules/stack.mdc"), "utf8");
  expect(cursor).toContain("AGENTS.md");
  await expect(stat(path.join(dir, ".claude"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/harness.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

Each tree is a few dozen lines: bun, `~/*`, Route Handlers + Zod, no tRPC, point at `AGENTS.md`. Not Apex Scout's harness novel.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/harness-grok template/extras/harness-cursor cli/src/harness.test.ts cli/src/installers.ts
git commit -m "feat: add optional Grok and Cursor harness extras"
```

---

### Task 13: GitHub Actions extra

**Files:**
- Create: `template/extras/github-actions/**`
- Test: `cli/src/github-actions.test.ts`

**Interfaces:**
- Consumes: `config.githubActions`, `config.playwright`
- Produces: `.github/workflows/ci.yml` with `bun run check`. Second job if Playwright.

- [ ] **Step 1: Write the failing test**

```ts
test("default yes writes ci.yml", async () => {
  const dir = await gen({});
  const yml = await readFile(path.join(dir, ".github/workflows/ci.yml"), "utf8");
  expect(yml).toContain("bun run check");
  expect(yml).not.toContain("test:e2e");
});

test("playwright adds an e2e job", async () => {
  const dir = await gen({ playwright: true });
  const yml = await readFile(path.join(dir, ".github/workflows/ci.yml"), "utf8");
  expect(yml).toContain("test:e2e");
  expect(yml).toContain("playwright install");
});

test("--no-github-actions skips the workflow", async () => {
  const dir = await gen({ githubActions: false });
  await expect(stat(path.join(dir, ".github"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

Note: `gen` currently forces `githubActions: false` in Task 5 helper. Change the helper so `{}` uses resolveConfig defaults (`true`). Tests that do not want CI pass `githubActions: false` explicitly. Update earlier tests that assumed the helper defaulted false.

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/github-actions.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

Two workflow templates, or one template with `__F7T_E2E_JOB__` replacement that becomes empty or a full job. Use `oven-sh/setup-bun@v2` and `bun install --frozen-lockfile`. Playwright job: `bunx playwright install --with-deps` then `bun run test:e2e`.

Because `--yes` defaults github-actions on, Task 2/3 tests now get a workflow file. That is fine.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template/extras/github-actions cli/src/github-actions.test.ts cli/src/test-helpers.ts cli/src/*.test.ts
git commit -m "feat: add GitHub Actions extra"
```

---

### Task 14: Rewrite env.js and AGENTS.md

**Files:**
- Modify: `cli/src/env-file.ts`
- Modify: `cli/src/agents.ts`
- Modify: `cli/src/create-app.ts`
- Modify: extras' `extra.json` `env` and `agents` fields
- Test: `cli/src/agents.test.ts`

**Interfaces:**
- Consumes: `CreateConfig` plus each extra's `extra.json`
- Produces: final `src/env.js`, `.env.example`, `.env`, `AGENTS.md` that only mention landed extras

- [ ] **Step 1: Write the failing test**

```ts
test("AGENTS.md lists sanity and not drizzle", async () => {
  const dir = await gen({ data: "sanity" });
  const agents = await readFile(path.join(dir, "AGENTS.md"), "utf8");
  expect(agents).toContain("Sanity");
  expect(agents).not.toContain("Drizzle");
  expect(agents).toContain("bun run check");
  expect(agents).toContain("~/*");
  expect(agents).toContain("no tRPC");
});

test("env.js gains DATABASE_URL only for drizzle", async () => {
  const none = await gen({});
  expect(await readFile(path.join(none, "src/env.js"), "utf8")).not.toContain("DATABASE_URL");
  const drizzle = await gen({ data: "drizzle" });
  expect(await readFile(path.join(drizzle, "src/env.js"), "utf8")).toContain("DATABASE_URL");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/agents.test.ts`

Expected: FAIL (stub AGENTS, env not merged)

- [ ] **Step 3: Implement writers**

`writeEnv(config)`: start from base keys (`NODE_ENV`, `NEXT_PUBLIC_SITE_URL`). Concat `env` from each extra that `shouldRun`. Render `src/env.js` with `createEnv`. Write `.env.example` and `.env`.

`writeAgents(config)`: sections from the spec (project one-liner, stack, commands, `src/` layout, conventions, do-not). Extra `agents` markdown spliced under stack/commands. Never mention an extra that did not run.

- [ ] **Step 4: Run tests**

Run: `bunx vitest run`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/env-file.ts cli/src/agents.ts cli/src/agents.test.ts template/extras cli/src/create-app.ts
git commit -m "feat: generate env.js and AGENTS.md from landed extras"
```

---

### Task 15: Wizard, git, bun install, next steps, CLI entry

**Files:**
- Create: `cli/src/index.ts`
- Create: `cli/src/prompts.ts`
- Create: `cli/src/git.ts`
- Create: `cli/src/install.ts`
- Create: `cli/src/next-steps.ts`
- Test: `cli/src/git.test.ts`, `cli/src/next-steps.test.ts`

**Interfaces:**
- Consumes: `parseArgv`, `resolveConfig`, `createApp`
- Produces: runnable `bun ./cli/src/index.ts shop --yes --skip-install`, `initGit(dir)`, `logNextSteps(config)`

- [ ] **Step 1: Write the failing tests**

`next-steps.test.ts`: `logNextSteps` for drizzle postgres includes `docker compose up`. For playwright includes `playwright install`. For sanity includes `typegen`. For `--yes` site/none includes `bun run dev` and `bun run check`. Capture stdout.

`git.test.ts`: `initGit` on a temp dir creates `.git`. If git is missing, do not throw (log and return).

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run cli/src/git.test.ts cli/src/next-steps.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

`cli/src/index.ts`:

```ts
#!/usr/bin/env bun
import { parseArgv, resolveConfig } from "./config";
import { createApp } from "./create-app";
import { runWizard } from "./prompts";
import { logNextSteps } from "./next-steps";

const input = parseArgv(process.argv.slice(2));
const resolved = input.yes || input.ci ? resolveConfig(input) : resolveConfig(await runWizard(input));
await createApp(resolved);
logNextSteps(resolved);
```

Wizard uses `@clack/prompts` 1.7.0 in spec order. Cancel on `isCancel`. `--yes` skips it.

`createApp` after AGENTS.md: if `config.git`, `initGit`. If `!config.skipInstall`, `bun install` in `projectDir` via `Bun.spawn(["bun", "install"], { cwd: projectDir })`. Non-zero install exit throws.

Add `@clack/prompts@1.7.0` and `commander@15.0.0` only if index uses commander. Prefer `parseArgv` already written; commander is optional wrapping. If commander fights custom `--no-github-actions`, skip commander and keep `parseArgv`. Spec named commander. Use commander to define options, then map to `FlagInput`. Tests stay on `parseArgv`.

- [ ] **Step 4: Run tests plus a real CLI invoke**

Run: `bunx vitest run`

Then: `bun cli/src/index.ts demo-yes --yes --skip-install --no-git` in a temp parent. Expected: exit 0, `demo-yes/` exists. Delete the folder.

- [ ] **Step 5: Commit**

```bash
git add cli/src/index.ts cli/src/prompts.ts cli/src/git.ts cli/src/install.ts cli/src/next-steps.ts cli/src/git.test.ts cli/src/next-steps.test.ts package.json bun.lock
git commit -m "feat: add wizard, git init, bun install, and next steps"
```

---

### Task 16: Fixture combos and one live `bun run check`

**Files:**
- Create: `cli/src/matrix.test.ts`
- Create: `.github/workflows/ci.yml` (this repo)

**Interfaces:**
- Consumes: `createApp`
- Produces: spec fixture combos + one integration generate that runs `bun install` and `bun run check`

- [ ] **Step 1: Write the failing tests**

`matrix.test.ts` (all `--skip-install`):

1. `--yes` (site, no data): no studio, no drizzle, no `.grok`, has shell-site, has github workflow
2. site + sanity + resend + locale pt-PT: studio, `/contacto`, no `DATABASE_URL`
3. app + drizzle postgres + shadcn: `compose.yaml`, `button.tsx`, no studio, `src/app/page.tsx` has `<main`
4. site + intl + playwright + harness both: `[locale]/page.tsx`, `e2e/smoke.spec.ts`, `.grok` and `.cursor`

Integration test, gated with `describe.skipIf(!process.env.F7T_LIVE_CHECK)` so local `bun test` stays fast, enabled in CI:

```ts
test("base+site passes bun run check", async () => {
  const dir = await gen({ skipInstall: false, git: false });
  const install = Bun.spawn(["bun", "install"], { cwd: dir, stdout: "inherit", stderr: "inherit" });
  expect(await install.exited).toBe(0);
  const check = Bun.spawn(["bun", "run", "check"], { cwd: dir, stdout: "inherit", stderr: "inherit" });
  expect(await check.exited).toBe(0);
}, 300_000);
```

- [ ] **Step 2: Run skip-install fixtures to verify they fail if anything drifted**

Run: `bunx vitest run cli/src/matrix.test.ts`

Expected: FAIL until combos match. Fix extras, do not weaken assertions.

- [ ] **Step 3: Add this-repo CI**

`.github/workflows/ci.yml`: setup bun 1.4.0, `bun install --frozen-lockfile`, `bun run check` (CLI package), `F7T_LIVE_CHECK=1 bunx vitest run cli/src/matrix.test.ts`.

Fix anything `bun run check` reports in `cli/` (oxlint, oxfmt, tsc).

Run the live check once locally:

```bash
F7T_LIVE_CHECK=1 bunx vitest run cli/src/matrix.test.ts
```

Expected: generated app `check` exits 0. If oxfmt/oxlint/react-doctor fail on the template, fix the template, not the gate.

- [ ] **Step 4: Run full CLI tests**

Run: `bun run check`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/matrix.test.ts .github/workflows/ci.yml template cli
git commit -m "test: cover spec fixture combos and live bun run check"
```

---

### Task 17: README and license

**Files:**
- Create: `README.md`
- Create: `LICENSE` (MIT)
- Modify: `package.json` description/keywords/repository if known

**Interfaces:**
- Consumes: spec publish section
- Produces: docs for `bunx create-f7t-app@latest`

- [ ] **Step 1: Write a failing test that README documents the wizard**

```ts
import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("README names invoke, flags, and out of scope", async () => {
  const readme = await readFile("README.md", "utf8");
  expect(readme).toContain("bunx create-f7t-app@latest");
  expect(readme).toContain("--data");
  expect(readme).toContain("tRPC");
  expect(readme).toContain("Laravel");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run cli/src/readme.test.ts`

Expected: FAIL

- [ ] **Step 3: Write README**

Sections: why (FunnySoft Next generator, T3-shaped), axioms, always-on list, wizard order, flags table from the spec, `--CI` / `--yes`, `--skip-install` as undocumented test flag or documented as "CI only", out of scope, development invoke `bun cli/src/index.ts`. No telemetry. MIT.

- [ ] **Step 4: Run tests**

Run: `bun run check`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add README.md LICENSE package.json cli/src/readme.test.ts
git commit -m "docs: add create-f7t-app README and MIT license"
```

---

## Self-review

**Spec coverage**

| Spec item | Task |
| --- | --- |
| Axioms / never list | 17 README, 14 AGENTS |
| Always-on stack + `bun run check` | 3, 16 |
| Wizard order + flags + `--yes` defaults | 1, 15 |
| `--CI`, force, target dir | 1, 2 |
| Base template files | 3 |
| Installer order | 4 |
| Shells | 5 |
| Sanity XOR Drizzle | 6, 7 |
| Drizzle sqlite/postgres | 7 |
| ShadCN Base UI vendored | 8 |
| Playwright | 9 |
| Resend + contact paths | 10 |
| next-intl + studio unprefixed | 11 |
| Harness none/grok/cursor/both | 12 |
| GitHub Actions + e2e job | 13 |
| AGENTS.md + env rewrite | 14 |
| git + bun install + next steps | 15 |
| Fixture combos + live check | 16 |
| Publish README MIT no telemetry | 17 |
| `--skip-install` | 1, 15 (test escape hatch, not wizard) |

**Placeholders:** none left. Intl has a spec-legal abort path with a concrete commit message.

**Types:** `CreateConfig`, `FlagInput`, `ExtraManifest`, `Installer`, `createApp`, `parseArgv`, `resolveConfig`, `appPagesRoot` stay those names through later tasks.
