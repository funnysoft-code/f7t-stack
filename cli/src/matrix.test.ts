import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

function run(cmd: string[], cwd: string): Promise<number> {
  const bunGlobal = (
    globalThis as unknown as {
      Bun?: {
        spawn: (
          argv: string[],
          opts: { cwd: string; stdout?: "inherit"; stderr?: "inherit" },
        ) => { exited: Promise<number> };
      };
    }
  ).Bun;
  if (bunGlobal) {
    return bunGlobal.spawn(cmd, { cwd, stdout: "inherit", stderr: "inherit" }).exited;
  }
  return new Promise((resolve, reject) => {
    const child = spawn(cmd[0]!, cmd.slice(1), {
      cwd,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

describe("fixture combos", () => {
  test("--yes site no data", async () => {
    const dir = await gen({});
    await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(stat(path.join(dir, "src/server/db"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(stat(path.join(dir, ".grok"))).rejects.toMatchObject({ code: "ENOENT" });
    const page = await readFile(path.join(dir, "src/app/page.tsx"), "utf8");
    expect(page).toContain("header");
    await expect(stat(path.join(dir, "src/lib/site.ts"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, ".github/workflows/ci.yml"))).resolves.toBeTruthy();
  });

  test("site + sanity + resend + locale pt-PT", async () => {
    const dir = await gen({ data: "sanity", resend: true, locale: "pt-PT" });
    await expect(stat(path.join(dir, "src/app/studio/[[...tool]]/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/app/contacto/page.tsx"))).resolves.toBeTruthy();
    const env = await readFile(path.join(dir, "src/env.js"), "utf8");
    expect(env).not.toContain("DATABASE_URL");
  });

  test("app + drizzle postgres + shadcn", async () => {
    const dir = await gen({
      shell: "app",
      data: "drizzle",
      db: "postgres",
      shadcn: true,
    });
    await expect(stat(path.join(dir, "compose.yaml"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/components/ui/button.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const page = await readFile(path.join(dir, "src/app/page.tsx"), "utf8");
    expect(page).toContain("<main");
  });

  test("site + intl + playwright + mandatory OpenCode selection", async () => {
    const dir = await gen({ intl: true, playwright: true, harness: "opencode" });
    await expect(stat(path.join(dir, "src/app/[locale]/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "e2e/smoke.spec.ts"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, ".grok"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(path.join(dir, ".cursor"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe.skipIf(!process.env.F7T_LIVE_CHECK)("live check", () => {
  test("base+site passes bun run check", async () => {
    const dir = await gen({ skipInstall: false, git: false });
    expect(await run(["bun", "install"], dir)).toBe(0);
    expect(await run(["bun", "run", "check"], dir)).toBe(0);
  }, 300_000);
});
