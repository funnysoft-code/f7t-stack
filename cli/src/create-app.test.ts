import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test, vi } from "vitest";
import { resolveConfig, type FlagInput } from "./config";
import { createApp, GenerationError } from "./create-app";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import { compositionKey, dependencyDigest, sha256 } from "./standards";
import { dependencyComposition, stacks } from "./stacks";
import { gen, trackTempDirs } from "./test-helpers";
import { runCli } from "./index";

trackTempDirs();

const temporaryRoot = realpathSync(tmpdir());
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function workspace() {
  const dir = await mkdtemp(path.join(temporaryRoot, "u4-"));
  dirs.push(dir);
  return dir;
}

// Explicit synthetic release input. Production always takes the same independent verifier path.
async function fixture(flags: FlagInput = {}) {
  const cwd = await workspace();
  const root = path.join(cwd, "bundle");
  const release = await releaseFixture(root);
  const config = resolveConfig({ appName: "shop", git: false, skipInstall: true, ...flags }, cwd);
  const templateRoot = stacks[config.stack].templateRoot;
  const pkg = { name: "__F7T_APP_NAME__", dependencies: { "fixture-dep": "1.0.0" } };
  if (config.stack !== "next-only") {
    const relative = `${templateRoot}/package.json`;
    const bytes = JSON.stringify(pkg);
    await writeFixtureFile(path.join(root, "template"), relative, bytes);
    release.assets.push({ path: relative, sha256: sha256(bytes), mode: 0o644, text: true });
  }
  release.locks[0]!.key = compositionKey(dependencyComposition(config));
  release.locks[0]!.manifests = { "package.json": dependencyDigest(pkg) };
  await writeFixtureFile(path.join(root, "template"), "manifest.json", JSON.stringify(release));
  const composeNext = vi.fn(async () => {});
  return { cwd, root, config, release, options: { bundleRoot: root, composeNext } };
}

describe("createApp", () => {
  test.each(["next-only", "inertia-monolith", "api-next"] as const)(
    "%s unattended CLI runs the verified generation chain",
    async (stack) => {
      const { cwd, config, options } = await fixture({ stack });
      const output: string[] = [];
      const exitCode = await runCli(
        ["shop", "--stack", stack, "--CI", "--skip-install", "--no-git", "--json"],
        {
          cwd,
          isTTY: false,
          output: (text) => output.push(text),
          generate: (resolved) => createApp(resolved, options),
        },
      );
      expect(exitCode).toBe(0);
      expect(output).toHaveLength(1);
      expect(JSON.parse(output[0]!)).toMatchObject({ stack, status: "setup-pending" });
      expect(await readdir(config.projectDir)).toContain("F7T_MANIFEST.json");
    },
  );
  test("the existing Next base keeps its scripts, source tree and promoted gitignore", async () => {
    const dir = await gen();
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.name).toBe("shop");
    expect(pkg.scripts.check).toContain("bun run lint");
    expect(pkg.scripts.lint).toBe("bash scripts/frontend-gate.sh lint");
    expect(pkg.devDependencies.oxfmt).toBeTruthy();
    expect(pkg.scripts.check).toContain("bun run doctor");
    expect(pkg.devDependencies["react-doctor"]).toBe("0.9.12");
    expect(pkg.packageManager).toBe("bun@1.4.0");
    expect(await readdir(dir)).toContain(".gitignore");
    expect(await readFile(path.join(dir, "src/app/page.tsx"), "utf8")).toContain("header");
    expect(await readFile(path.join(dir, "src/app/layout.tsx"), "utf8")).toContain("shop");
    const env = await readFile(path.join(dir, "src/env.js"), "utf8");
    expect(env).toContain("NEXT_PUBLIC_SITE_URL");
    expect(env).not.toContain("DATABASE_URL");
  });
  test.each(["next-only", "inertia-monolith", "api-next"] as const)(
    "%s copies only its stack and stamps verified standards and lock",
    async (stack) => {
      const { config, options } = await fixture({ stack });
      const result = await createApp(config, options);
      expect(result).toMatchObject({
        status: "setup-pending",
        stack,
        failedStage: null,
        pendingSteps: ["dependencies", "local-setup", "verification"],
      });
      expect(
        JSON.parse(await readFile(path.join(config.projectDir, "F7T_MANIFEST.json"), "utf8"))
          .variant,
      ).toBe(stack);
      expect(await readFile(path.join(config.projectDir, "bun.lock"), "utf8")).toContain("fixture");
      expect(await readFile(path.join(config.projectDir, "package.json"), "utf8")).toContain(
        '"shop"',
      );
      expect(options.composeNext).toHaveBeenCalledTimes(stack === "next-only" ? 1 : 0);
      if (stack === "next-only") {
        expect(await readdir(config.projectDir)).not.toContain("services");
        expect(await readdir(config.projectDir)).not.toContain("artisan");
      }
      if (stack === "api-next")
        expect(
          await readFile(path.join(config.projectDir, "services/api/composer.json"), "utf8"),
        ).toContain("php");
    },
  );

  test.each([
    { data: "none" },
    { data: "sanity" },
    { data: "drizzle", db: "sqlite" },
    { data: "drizzle", db: "postgres" },
    { shell: "app", intl: true, locale: "pt-PT", shadcn: true, playwright: true, resend: true },
  ] satisfies FlagInput[])("Next composition dispatch %j", async (flags) => {
    const { config, options } = await fixture(flags);
    await expect(createApp(config, options)).resolves.toMatchObject({
      status: "setup-pending",
      stack: "next-only",
    });
    expect(options.composeNext).toHaveBeenCalledWith(config);
  });

  test.each([false, true])(
    "nonempty targets reject force=%s without touching files",
    async (force) => {
      const { config, options } = await fixture({ force });
      await writeFixtureFile(config.projectDir, ".keep", "preserve");
      await expect(createApp(config, options)).rejects.toThrow(/--force no longer/);
      expect(await readdir(config.projectDir)).toEqual([".keep"]);
      expect(await readFile(path.join(config.projectDir, ".keep"), "utf8")).toBe("preserve");
    },
  );

  test("target symlinks reject without following them", async () => {
    const { cwd, config, options } = await fixture();
    const other = path.join(cwd, "other");
    await writeFixtureFile(other, ".keep", "preserve");
    await symlink(other, config.projectDir);
    await expect(createApp(config, options)).rejects.toThrow(/regular directories/);
    expect(await readdir(other)).toEqual([".keep"]);
  });

  test("tampered standards fail independently before creating a target", async () => {
    const { config, root, options } = await fixture();
    await writeFile(path.join(root, "template/standards/apply.mjs"), "tampered");
    await expect(createApp(config, options)).rejects.toThrow(/digest mismatch/);
    await expect(readdir(config.projectDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("missing composition fails before creating a target", async () => {
    const { config, root, release, options } = await fixture();
    release.locks[0]!.key = compositionKey({ stack: "not-this-composition" });
    await writeFile(path.join(root, "template/manifest.json"), JSON.stringify(release));
    await expect(createApp(config, options)).rejects.toThrow(/No unique tested release lock/);
    await expect(readdir(config.projectDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("pending production release cannot be bypassed by skip-install", async () => {
    const cwd = await workspace();
    const config = resolveConfig({ appName: "shop", skipInstall: true, git: false }, cwd);
    await expect(createApp(config)).rejects.toThrow(/pending U14/);
    await expect(readdir(config.projectDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("skip-install never invokes dependencies or setup", async () => {
    const { config, options } = await fixture();
    const install = vi.fn();
    const setup = vi.fn();
    await createApp(config, { ...options, install, setup });
    expect(install).not.toHaveBeenCalled();
    expect(setup).not.toHaveBeenCalled();
  });

  test("dependency failure is incomplete, suppresses secrets and never runs setup", async () => {
    const { config, options } = await fixture({ skipInstall: false });
    const setup = vi.fn();
    const error = await createApp(config, {
      ...options,
      install: async () => {
        throw new Error("secret-credential");
      },
      setup,
    }).catch((error: GenerationError) => error);
    expect(error).toBeInstanceOf(GenerationError);
    expect((error as GenerationError).result).toMatchObject({
      status: "incomplete",
      failedStage: "dependencies",
    });
    expect(JSON.stringify(error)).not.toContain("secret-credential");
    expect(setup).not.toHaveBeenCalled();
  });

  test("successful dependency installation still needs local setup verification", async () => {
    const { config, options } = await fixture({ skipInstall: false });
    await expect(createApp(config, { ...options, install: async () => {} })).resolves.toMatchObject(
      { status: "setup-pending", pendingSteps: ["local-setup", "verification"] },
    );
  });

  test("unavailable Laravel setup fails preflight with files-only guidance before writes", async () => {
    const { config, options } = await fixture({ stack: "api-next", skipInstall: false });
    await expect(createApp(config, options)).rejects.toThrow(/--skip-install/);
    await expect(readdir(config.projectDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("setup failures retain an incomplete stage with a recovery entry point", async () => {
    const { config, options } = await fixture({ skipInstall: false });
    const error = await createApp(config, {
      ...options,
      install: async () => {},
      setup: async () => {
        throw new Error("secret");
      },
    }).catch((error: GenerationError) => error);
    expect((error as GenerationError).result).toMatchObject({
      status: "incomplete",
      failedStage: "setup",
      pendingSteps: ["local-setup", "verification"],
      recovery: "bun run setup",
    });
    expect(JSON.stringify(error)).not.toContain('"secret"');
  });

  test("malformed programmatic configuration fails before target creation", async () => {
    const { config, options } = await fixture();
    await expect(
      createApp({ ...config, projectDir: path.join(config.projectDir, "other") }, options),
    ).rejects.toThrow(/normalized configuration/);
    await expect(readdir(config.projectDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("copy failures preserve the partial output and require a new empty target", async () => {
    const { config, options } = await fixture();
    const error = await createApp(config, {
      ...options,
      composeNext: async () => {
        throw new Error("secret");
      },
    }).catch((error: GenerationError) => error);
    expect((error as GenerationError).result).toMatchObject({
      failedStage: "copy",
      recovery: "Use a new empty target after resolving the reported issue",
    });
    expect(await readdir(config.projectDir)).toContain("package.json");
    expect(JSON.stringify(error)).not.toContain('"secret"');
  });
});
