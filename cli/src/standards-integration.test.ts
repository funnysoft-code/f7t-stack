import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";
import { isTemplateText } from "./fs";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import {
  compositionKey,
  dependencyDigest,
  packageInventory,
  sha256,
  verifyStandardsBundle,
} from "./standards";
import { dependencyComposition, STACK_IDS, stacks } from "./stacks";

// Explicit opt-in source for building a real export fixture, never a production dependency.
// Only this immutable archive is read. No working-tree files or private dependencies are copied.
const source = process.env.F7T_STANDARDS_FIXTURE_SOURCE;
const commit = "13889e25ab3df8a06307156722dc08377183b356";
const identity = "v0.3.1";
const temps: string[] = [];
afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

test.skipIf(!source).each(STACK_IDS)(
  "published export composes %s before the install boundary",
  async (stack) => {
    const temp = await mkdtemp(path.join(realpathSync(tmpdir()), "f7t-u15-"));
    temps.push(temp);
    const archiveRoot = path.join(temp, "standards-source");
    await mkdir(archiveRoot);
    const archive = execFileSync("git", ["-C", source!, "archive", commit], {
      maxBuffer: 8 * 1024 * 1024,
    });
    execFileSync("tar", ["-xf", "-", "-C", archiveRoot], { input: archive });
    const bundle = path.join(temp, "bundle");
    const release = await releaseFixture(bundle);
    const template = path.join(bundle, "template");
    const exportRoot = path.join(template, "standards");
    await rm(exportRoot, { recursive: true });
    execFileSync("node", [
      path.join(archiveRoot, "scripts/standards-export.mjs"),
      "export",
      "--target",
      exportRoot,
      "--release",
      identity,
      "--commit",
      commit,
    ]);
    // Applying must work after the source archive is gone.
    await rm(archiveRoot, { recursive: true });
    const exported = JSON.parse(await readFile(path.join(exportRoot, "manifest.json"), "utf8"));
    verifyStandardsBundle(exportRoot, exported.assetDigest);
    const current = JSON.parse(await readFile(path.resolve("template/manifest.json"), "utf8"));
    expect(current.standards).toMatchObject({
      commit,
      release: identity,
      assetDigest: exported.assetDigest,
    });
    release.standards = { ...exported.standards, assetDigest: exported.assetDigest };
    await cp(path.resolve("template/shared"), path.join(template, "shared"), { recursive: true });
    for (const variant of STACK_IDS) {
      const root = stacks[variant].templateRoot;
      // U17's design artifacts are outside this tooling fixture.
      await cp(path.resolve("template", root), path.join(template, root), {
        recursive: true,
        filter: (file) =>
          !file.includes(`${path.sep}design${path.sep}`) &&
          !file.includes(`${path.sep}packages${path.sep}design-system`),
      });
    }
    const config = resolveConfig(
      { appName: "fixture", stack, git: false, skipInstall: false, yes: true },
      temp,
    );
    const root = stacks[stack].templateRoot;
    const manifests: Record<string, string> = {};
    for (const file of packageInventory(path.join(template, root)).filter((file) =>
      /(^|\/)(package|composer)\.json$/.test(file),
    )) {
      manifests[file] = dependencyDigest(
        JSON.parse(await readFile(path.join(template, root, file), "utf8")),
      );
    }
    release.locks[0]!.key = compositionKey(dependencyComposition(config));
    release.locks[0]!.manifests = manifests;
    release.assets = await Promise.all(
      packageInventory(template)
        .filter((file) => file !== "manifest.json" && !file.startsWith("standards/"))
        .map(async (file) => ({
          path: file,
          sha256: sha256(await readFile(path.join(template, file))),
          mode: (await lstat(path.join(template, file))).mode & 0o111 ? 0o755 : 0o644,
          text: isTemplateText(file),
        })),
    );
    await writeFixtureFile(template, "manifest.json", JSON.stringify(release));
    let reachedInstall = false;
    let installAssertion: unknown;
    await createApp(config, {
      bundleRoot: bundle,
      composeNext: async () => {},
      install: async () => {
        reachedInstall = true;
        try {
          const target = config.projectDir;
          const read = (file: string) => readFile(path.join(target, file), "utf8");
          const brief = await read("AGENTS.md");
          expect(brief).toContain(
            "Before work, read the applicable `.opencode/rules/*.md` files and the pinned `docs/playbook/README.md`.",
          );
          expect(brief.split("\n").length).toBeLessThan(25);
          expect(brief).not.toMatch(/\/Users\/|~\/|\.\.\/standards/);
          const receipt = JSON.parse(await read("STANDARDS_MANIFEST.json"));
          expect(receipt.standards).toEqual({ release: identity, commit });
          expect(receipt.layout.jsRoots).toEqual(stacks[stack].jsRoots);
          expect(await read("F7T_MANIFEST.json")).toContain(commit);
          const opencode = JSON.parse(await read("opencode.json"));
          expect(opencode.mcp.servers.mobbin).toBeTruthy();
          expect(opencode).not.toHaveProperty("provider");
          expect(opencode).not.toHaveProperty("model");
          const pkg = JSON.parse(await read("package.json"));
          for (const script of Object.values(pkg.scripts) as string[]) {
            for (const match of script.matchAll(/bash (scripts\/[^ ]+)/g)) {
              expect(existsSync(path.join(target, match[1]!)), script).toBe(true);
            }
          }
          const gate = await read("scripts/frontend-gate.sh");
          expect(gate).toContain("--scope full --no-telemetry --blocking warning");
          expect(gate).toContain("--coverage.thresholds.lines=100");
          expect(await read(".github/workflows/quality.yml")).toContain("frontend-gate.sh");
          expect(existsSync(path.join(target, ".github/workflows/ci.yml"))).toBe(false);
          if (stack === "next-only") {
            expect(Object.keys(opencode.mcp.servers)).toEqual(["mobbin"]);
            for (const file of [
              "composer.json",
              "boost.json",
              "scripts/php-gate.sh",
              "scripts/boost-sync-opencode-skills.sh",
              ".opencode/rules/laravel-api.md",
            ]) {
              expect(existsSync(path.join(target, file)), file).toBe(false);
            }
          } else {
            const php = stacks[stack].phpRoot!;
            expect(
              JSON.parse(await read(`${php}/packages/boost-guidelines/composer.json`)).name,
            ).toBe("funnysoft/boost-guidelines");
            expect(
              (
                await lstat(path.join(target, ".opencode/skills/funnysoft-quality/SKILL.md"))
              ).isSymbolicLink(),
            ).toBe(false);
            expect(await read("scripts/php-gate.sh")).toContain(`cd "$root/${php}"`);
            expect(await read("scripts/php-gate.sh")).toContain("--type-coverage --min=100");
            if (stack === "api-next") {
              expect(JSON.stringify(opencode.mcp.servers["laravel-boost"])).toContain(
                "services/api/artisan",
              );
              expect(await read("scripts/generate-api-client.sh")).toContain(
                'php artisan scramble:export --path="$tmp/openapi.json"',
              );
              expect(await read("scripts/check-workflows.mjs")).toContain("tests/workflows.yml");
            }
          }
        } catch (error) {
          installAssertion = error;
        }
      },
    });
    if (installAssertion) throw installAssertion;
    expect(reachedInstall).toBe(true);
  },
);
