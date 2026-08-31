import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("playwright extra", () => {
  test("playwright extra adds a / smoke spec", async () => {
    const dir = await gen({ playwright: true });
    const spec = await readFile(path.join(dir, "e2e/smoke.spec.ts"), "utf8");
    expect(spec).toContain('goto("/")');
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
    expect(pkg.devDependencies["@playwright/test"]).toBe("1.62.1");
  });
});
