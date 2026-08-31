import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { initGit } from "./git";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("initGit", () => {
  test("creates .git in a temp dir", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "f7t-git-"));
    dirs.push(dir);
    await initGit(dir);
    await expect(stat(path.join(dir, ".git"))).resolves.toBeTruthy();
  });

  test("does not throw if git is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "f7t-git-missing-"));
    dirs.push(dir);
    const previousPath = process.env.PATH;
    process.env.PATH = "/no-such-git-bin";
    try {
      await expect(initGit(dir)).resolves.toBeUndefined();
    } finally {
      process.env.PATH = previousPath;
    }
  });
});
