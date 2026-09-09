import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";
import { generationMatrix } from "./release-matrix";
import { packedMatrix } from "./packed-matrix";
import { packageRoot } from "./paths";

trackTempDirs();

test.each(generationMatrix().filter((flags) => flags.stack === "next-only"))(
  "complete Next composition %j",
  async (flags) => {
    const dir = await gen(flags);
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(Boolean(pkg.dependencies["next-intl"])).toBe(flags.intl);
    expect(Boolean(pkg.dependencies.resend)).toBe(flags.resend);
    expect(pkg.devDependencies["@playwright/test"]).toBe("1.62.1");
    expect(Boolean(pkg.scripts["test:e2e"])).toBe(flags.playwright);
    expect(Boolean(pkg.dependencies["drizzle-orm"])).toBe(flags.data === "drizzle");
    await expect(stat(path.join(dir, "composer.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(path.join(dir, "artisan"))).rejects.toMatchObject({ code: "ENOENT" });
    const page = await readFile(
      path.join(dir, flags.intl ? "src/app/[locale]/page.tsx" : "src/app/page.tsx"),
      "utf8",
    );
    expect(page).not.toContain("__F7T_");
    expect(page).toContain(flags.shell === "site" ? "header" : "<main");
  },
);

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
    await expect(stat(path.join(dir, ".github/workflows/ci.yml"))).rejects.toMatchObject({
      code: "ENOENT",
    });
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
  test("released npm artifact generates the full matrix and frozen-installs every key", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "f7t-live-matrix-"));
    try {
      await packedMatrix({
        source: packageRoot(),
        output: path.join(dir, "packed"),
        fixtureMode: false,
        install: true,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 3_600_000);
});
