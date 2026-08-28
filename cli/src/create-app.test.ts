import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createApp", () => {
  test("copies base and substitutes the app name", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true },
      cwd,
    );
    await createApp(config);
    const pkg = JSON.parse(
      await readFile(path.join(config.projectDir, "package.json"), "utf8"),
    );
    expect(pkg.name).toBe("shop");
    expect(config.projectDir).toBe(path.join(cwd, "shop"));
  });

  test("aborts when the directory is not empty", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    await mkdir(path.join(cwd, "shop"));
    await writeFile(path.join(cwd, "shop", "nope.txt"), "x");
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true },
      cwd,
    );
    await expect(createApp(config)).rejects.toThrow(/not empty/);
  });

  test("--force overwrites", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
    dirs.push(cwd);
    await mkdir(path.join(cwd, "shop"));
    await writeFile(path.join(cwd, "shop", "nope.txt"), "x");
    const config = resolveConfig(
      { appName: "shop", yes: true, skipInstall: true, force: true },
      cwd,
    );
    await createApp(config);
    await expect(stat(path.join(config.projectDir, "package.json"))).resolves.toBeTruthy();
  });
});
