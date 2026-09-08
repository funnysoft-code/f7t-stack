import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("github-actions extra", () => {
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

  test("--no-github-actions is rejected", async () => {
    await expect(gen({ githubActions: false })).rejects.toThrow(/mandatory/);
  });
});
