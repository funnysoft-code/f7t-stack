import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("harness extras", () => {
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
});
