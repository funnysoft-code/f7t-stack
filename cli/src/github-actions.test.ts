import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("github-actions extra", () => {
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
