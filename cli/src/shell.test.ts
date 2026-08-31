import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

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
    expect(page).not.toContain('from "~/components/ui/button"');
  });
});
