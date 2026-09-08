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
  });

  test("env.js gains DATABASE_URL only for drizzle", async () => {
    const none = await gen({});
    expect(await readFile(path.join(none, "src/env.js"), "utf8")).not.toContain("DATABASE_URL");
    const drizzle = await gen({ data: "drizzle" });
    expect(await readFile(path.join(drizzle, "src/env.js"), "utf8")).toContain("DATABASE_URL");
  });
});
