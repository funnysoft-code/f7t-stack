import { cp, lstat, mkdtemp, readFile, rm } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import type { FlagInput } from "./config";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";
import { isTemplateText } from "./fs";
import { landedExtras } from "./installers";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import { templateDir } from "./paths";
import { compositionKey, dependencyDigest, packageInventory, sha256 } from "./standards";
import { dependencyComposition } from "./stacks";

const dirs: string[] = [];

export function trackTempDirs(): void {
  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });
}

export async function gen(
  flags: Omit<FlagInput, "appName"> & { appName?: string } = {},
): Promise<string> {
  const cwd = await mkdtemp(path.join(realpathSync(tmpdir()), "f7t-"));
  dirs.push(cwd);
  const config = resolveConfig(
    {
      appName: "shop",
      yes: true,
      skipInstall: true,
      git: false,
      ...flags,
    },
    cwd,
  );
  if (!config.skipInstall) {
    // Live verification must consume a real release, never synthetic dependency locks.
    await createApp(config);
    return config.projectDir;
  }
  if (config.stack !== "next-only") throw new Error("Legacy extra fixtures require Next-only");
  const bundleRoot = path.join(cwd, "fixture-bundle");
  const release = await releaseFixture(bundleRoot);
  const template = path.join(bundleRoot, "template");
  await cp(templateDir("base"), path.join(template, "base"), { recursive: true });
  await cp(templateDir("extras"), path.join(template, "extras"), { recursive: true });
  const pkg = JSON.parse(await readFile(path.join(template, "base/package.json"), "utf8"));
  for (const { manifest } of landedExtras(config)) {
    for (const field of ["dependencies", "devDependencies"] as const) {
      if (manifest.package?.[field]) pkg[field] = { ...pkg[field], ...manifest.package[field] };
    }
  }
  release.locks[0]!.key = compositionKey(dependencyComposition(config));
  release.locks[0]!.manifests = { "package.json": dependencyDigest(pkg) };
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
  await createApp(config, { bundleRoot });
  return config.projectDir;
}
