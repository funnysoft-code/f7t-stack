import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { copyTemplateDir } from "./fs";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import {
  applyBundledStandards,
  applyReleaseLock,
  compositionKey,
  dependencyDigest,
  sha256,
  verifyReleaseBundle,
  verifyStandardsBundle,
} from "./standards";

const temps: string[] = [];
afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "f7t-standards-"));
  temps.push(root);
  const release = await releaseFixture(root);
  return {
    root,
    release,
    target: path.join(root, "output"),
    exportRoot: path.join(root, "template/standards"),
  };
}
const inputs = {
  variant: "next-only" as const,
  team: "Fixture",
  teamSlug: "fixture",
  productBlurb: "Fixture product",
};

test("verifies schema 1 and stamps shared runtime with generator receipt", async () => {
  const { root, release, target } = await fixture();
  expect(verifyReleaseBundle(root)).toEqual(release);
  await applyBundledStandards({ ...inputs, target }, root);
  expect(await readFile(path.join(target, "docs/playbook/fixture.md"), "utf8")).toBe(
    "# Fixture\nnext-only\n",
  );
  expect(JSON.parse(await readFile(path.join(target, "F7T_MANIFEST.json"), "utf8"))).toMatchObject({
    generatorVersion: release.generatorVersion,
    templateRevision: release.templateRevision,
    standards: release.standards,
  });
});

test.each(["directory", "symlink"])(
  "rejects a %s project brief before any standards writes",
  async (kind) => {
    const { root, target } = await fixture();
    await mkdir(target);
    if (kind === "directory") await mkdir(path.join(target, "AGENTS.md"));
    else await symlink(path.join(root, "outside.md"), path.join(target, "AGENTS.md"));
    await expect(applyBundledStandards({ ...inputs, target }, root)).rejects.toThrow();
    await expect(stat(path.join(target, "STANDARDS_VERSION"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(stat(path.join(root, "outside.md"))).rejects.toMatchObject({ code: "ENOENT" });
  },
);

test.each(["runtime", "asset", "manifest", "pin", "extra", "symlink"])(
  "rejects %s tampering before runtime import or target writes",
  async (kind) => {
    const { root, target, exportRoot, release } = await fixture();
    const marker = path.join(root, "runtime-executed");
    if (kind === "runtime")
      await writeFile(
        path.join(exportRoot, "apply.mjs"),
        `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'bad');`,
      );
    if (kind === "asset")
      await writeFile(
        path.join(exportRoot, "variants/api-next/files/docs/playbook/fixture.md"),
        "tampered",
      );
    if (kind === "manifest") {
      const file = path.join(exportRoot, "manifest.json");
      const value = JSON.parse(await readFile(file, "utf8"));
      value.runtime.sha256 = "0".repeat(64);
      await writeFile(file, JSON.stringify(value));
    }
    if (kind === "pin")
      await writeFile(
        path.join(root, "template/manifest.json"),
        JSON.stringify({
          ...release,
          standards: { ...release.standards, assetDigest: "0".repeat(64) },
        }),
      );
    if (kind === "extra") await writeFixtureFile(exportRoot, "extra.mjs", "throw new Error('bad')");
    if (kind === "symlink") {
      await rm(path.join(exportRoot, "apply.mjs"));
      await symlink(marker, path.join(exportRoot, "apply.mjs"));
    }
    await expect(applyBundledStandards({ ...inputs, target }, root)).rejects.toThrow();
    await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(marker)).rejects.toMatchObject({ code: "ENOENT" });
  },
);

test.each(["../escape", "/absolute", "C:/escape", "variants\\escape"])(
  "rejects pinned malformed runtime path %s independently",
  async (runtimePath) => {
    const { exportRoot } = await fixture();
    const file = path.join(exportRoot, "manifest.json");
    const { assetDigest: _digest, ...manifest } = JSON.parse(await readFile(file, "utf8"));
    manifest.runtime.source = runtimePath;
    const digest = sha256(JSON.stringify(manifest));
    await writeFile(file, JSON.stringify({ ...manifest, assetDigest: digest }));
    expect(() => verifyStandardsBundle(exportRoot, digest)).toThrow(/runtime path/);
  },
);

test("composition locks reject unsupported choices and manifest drift without lock writes", async () => {
  const { root, target } = await fixture();
  await copyTemplateDir(path.join(root, "template/base"), target, { __F7T_APP_NAME__: "demo" });
  await expect(
    applyReleaseLock(target, { stack: "next-only", data: "sanity" }, root),
  ).rejects.toThrow(/tested release lock/);
  await expect(stat(path.join(target, "bun.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  await applyReleaseLock(target, { data: "none", stack: "next-only" }, root);
  expect(await readFile(path.join(target, "bun.lock"), "utf8")).toContain("lockfileVersion");
  await rm(path.join(target, "bun.lock"));
  await writeFile(path.join(target, "package.json"), '{"dependencies":{"fixture-dep":"2.0.0"}}');
  await expect(
    applyReleaseLock(target, { stack: "next-only", data: "none" }, root),
  ).rejects.toThrow(/composition mismatch/);
  await expect(stat(path.join(target, "bun.lock"))).rejects.toMatchObject({ code: "ENOENT" });
});

test("dependency fingerprints ignore product name but bind overrides and workspace requirements", () => {
  expect(compositionKey({ stack: "next-only", data: "none" })).toBe(
    compositionKey({ data: "none", stack: "next-only" }),
  );
  expect(dependencyDigest({ name: "a", dependencies: { b: "1", a: "2" } })).toBe(
    dependencyDigest({ name: "b", dependencies: { a: "2", b: "1" } }),
  );
  expect(dependencyDigest({ dependencies: { a: "2" } })).not.toBe(
    dependencyDigest({ dependencies: { a: "2" }, overrides: { a: "3" } }),
  );
});

test.each([
  "template-bytes",
  "template-mode",
  "text-policy",
  "lock-bytes",
  "duplicate-lock",
  "pending",
])("release verification rejects %s before target creation", async (kind) => {
  const { root, target, release } = await fixture();
  if (kind === "template-bytes") await writeFixtureFile(root, "template/base/package.json", "{}");
  if (kind === "template-mode")
    await writeFixtureFile(
      root,
      "template/base/scripts/check.sh",
      "#!/bin/sh\necho __F7T_APP_NAME__\n",
      0o644,
    );
  if (kind === "text-policy") {
    release.assets[0]!.text = false;
    await writeFile(path.join(root, "template/manifest.json"), JSON.stringify(release));
  }
  if (kind === "lock-bytes") await writeFixtureFile(root, "template/locks/next.lock", "changed");
  if (kind === "duplicate-lock") {
    release.locks.push(release.locks[0]!);
    await writeFile(path.join(root, "template/manifest.json"), JSON.stringify(release));
  }
  if (kind === "pending")
    await writeFile(
      path.join(root, "template/manifest.json"),
      JSON.stringify({ schemaVersion: 1, status: "pending-release" }),
    );
  await expect(applyBundledStandards({ ...inputs, target }, root)).rejects.toThrow();
  await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
});
