import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("standards stamping and env.js rewrite", () => {
  test("generation delegates policy assets to the verified standards export", async () => {
    const dir = await gen({ data: "sanity" });
    const manifest = JSON.parse(await readFile(path.join(dir, "STANDARDS_MANIFEST.json"), "utf8"));
    expect(manifest.variant).toBe("next-only");
    expect(manifest.standards.release).toBe("v0.0.0-fixture");
    expect(await readFile(path.join(dir, "docs/playbook/fixture.md"), "utf8")).toContain(
      "FunnySoft",
    );
    const brief = await readFile(path.join(dir, "AGENTS.md"), "utf8");
    expect(brief).toContain(
      "Before work, read the applicable `.opencode/rules/*.md` files and the pinned `docs/playbook/README.md`.",
    );
    expect(brief).not.toMatch(/Composer|Boost|php artisan|\/Users\/|~\//);
  });

  test("env.js gains DATABASE_URL only for drizzle", async () => {
    const none = await gen({});
    expect(await readFile(path.join(none, "src/env.js"), "utf8")).not.toContain("DATABASE_URL");
    const drizzle = await gen({ data: "drizzle" });
    expect(await readFile(path.join(drizzle, "src/env.js"), "utf8")).toContain("DATABASE_URL");
    expect(await readFile(path.join(drizzle, "src/bun-env.d.ts"), "utf8")).toContain(
      'reference types="bun"',
    );
    expect(await readFile(path.join(none, "src/env.js"), "utf8")).toContain("z.url()");
  });

  test("selected integration entries stay scanned and localized shells use localized links", async () => {
    const dir = await gen({ data: "drizzle", db: "sqlite", intl: true, shadcn: true });
    expect(JSON.parse(await readFile(path.join(dir, "knip.json"), "utf8"))).toEqual({
      entry: [
        "src/server/db/index.ts",
        "src/server/db/schema.ts",
        "src/components/ui/button.tsx",
        "src/i18n/navigation.ts",
      ],
    });
    const page = await readFile(path.join(dir, "src/app/[locale]/page.tsx"), "utf8");
    expect(page).toContain('import { Link } from "~/i18n/navigation"');
    expect(page).not.toContain("<a ");
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    for (const field of ["dependencies", "devDependencies"]) {
      expect(Object.keys(pkg[field])).toEqual(Object.keys(pkg[field]).sort());
    }
  });
});
