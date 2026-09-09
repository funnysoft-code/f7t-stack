import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("github-actions extra", () => {
  test.each(["next-only", "inertia-monolith", "api-next"])(
    "generated CI prepares %s with command-scoped setup environment",
    async (stack) => {
      const parsed = spawnSync(
        "bun",
        [
          "-e",
          'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text())))',
        ],
        { encoding: "utf8" },
      );
      expect(parsed.status, parsed.stderr).toBe(0);
      const job = JSON.parse(parsed.stdout).jobs["generated-gates"];
      const step = job.steps.find(
        (entry: { name?: string }) =>
          entry.name === "Frozen install and prepare generated application",
      );
      const dir = await mkdtemp(path.join(tmpdir(), "f7t-ci-setup-"));
      try {
        const phpRoot = stack === "api-next" ? "services/api" : ".";
        await mkdir(path.join(dir, phpRoot), { recursive: true });
        await mkdir(path.join(dir, "bin"));
        await mkdir(path.join(dir, "scripts"));
        await writeFile(path.join(dir, phpRoot, ".env.example"), "");
        if (stack === "api-next") {
          await mkdir(path.join(dir, "apps/web"), { recursive: true });
          await writeFile(
            path.join(dir, "apps/web/.env.example"),
            "FRONTEND_URL=http://localhost:3000\n",
          );
        }
        await writeFile(
          path.join(dir, "scripts/boost-sync-opencode-skills.sh"),
          'test "$APP_ENV" = testing\n',
        );
        const probe = `#!/usr/bin/env bash
set -eu
name="$(basename "$0")"
case "$name $*" in
  'bun run db:generate'|'bun run db:migrate') [[ "$DATABASE_URL" == file:* ]] ;;
  'php artisan boost:install'*) [[ "$APP_ENV" == local ]] ;;
  *) [[ "$APP_ENV" == testing ]] ;;
esac
printf '%s %s\\n' "$name" "$*" >> "$TRACE"
`;
        for (const name of ["bun", "php", "composer"]) {
          await writeFile(path.join(dir, "bin", name), probe, { mode: 0o755 });
        }
        const result = spawnSync("bash", ["-c", step.run], {
          cwd: dir,
          encoding: "utf8",
          env: {
            ...process.env,
            ...job.env,
            STACK: stack,
            CASE: "sqlite",
            TRACE: path.join(dir, "trace"),
            PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
          },
        });
        expect(result.status, result.stderr).toBe(0);
        if (stack === "api-next") {
          expect(await readFile(path.join(dir, "apps/web/.env"), "utf8")).toBe(
            await readFile(path.join(dir, "apps/web/.env.example"), "utf8"),
          );
        }
        const trace = await readFile(path.join(dir, "trace"), "utf8");
        expect(trace).toContain(
          stack === "next-only" ? "bun run db:migrate" : "php artisan boost:install",
        );
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  test("default yes leaves workflow ownership to standards", async () => {
    const dir = await gen({});
    await expect(readFile(path.join(dir, ".github/workflows/ci.yml"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("playwright keeps its test command while standards owns browser CI", async () => {
    const dir = await gen({ playwright: true });
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
    expect(pkg.devDependencies["@playwright/test"]).toBe("1.62.1");
    await expect(readFile(path.join(dir, ".github/workflows/ci.yml"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("--no-github-actions is rejected", async () => {
    await expect(gen({ githubActions: false })).rejects.toThrow(/mandatory/);
  });
});
