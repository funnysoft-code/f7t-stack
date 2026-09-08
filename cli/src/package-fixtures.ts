import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compositionKey, dependencyDigest, sha256, type ReleaseManifest } from "./standards";

// Synthetic schema 1 fixture. No standards checkout, release claim or private package.
const runtime = `import fs from 'node:fs';
import path from 'node:path';
export function verifyExport(root, digest) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  if (manifest.assetDigest !== digest) throw new Error('fixture digest mismatch');
  return manifest;
}
export function applyExport({ exportRoot, expectedDigest, target, variant, team }) {
  const manifest = verifyExport(exportRoot, expectedDigest);
  for (const asset of manifest.variants[variant].assets) {
    const dest = path.join(target, asset.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(path.join(exportRoot, asset.source), 'utf8').replaceAll('__TEAM__', team));
    fs.chmodSync(dest, asset.mode);
  }
  fs.writeFileSync(path.join(target, 'STANDARDS_VERSION'), manifest.standards.release + '\\n');
  fs.writeFileSync(path.join(target, 'STANDARDS_MANIFEST.json'), JSON.stringify({ standards: manifest.standards, assetDigest: manifest.assetDigest, variant }));
}
`;

export async function writeFixtureFile(
  root: string,
  relative: string,
  bytes: string | Buffer,
  mode = 0o644,
): Promise<void> {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  await chmod(file, mode);
}

export async function releaseFixture(root: string): Promise<ReleaseManifest> {
  const template = path.join(root, "template");
  const exportRoot = path.join(template, "standards");
  const standards = { release: "v0.0.0-fixture", commit: "1".repeat(40) };
  const variants = Object.fromEntries(
    await Promise.all(
      ["next-only", "inertia-monolith", "api-next"].map(async (variant) => {
        const source = `variants/${variant}/files/docs/playbook/fixture.md`;
        const text = `# __TEAM__\n${variant}\n`;
        await writeFixtureFile(exportRoot, source, text);
        return [
          variant,
          {
            layout: {
              phpRoot:
                variant === "next-only" ? null : variant === "api-next" ? "services/api" : ".",
              jsRoots: ["."],
              boostArtisan: null,
              boostSkills: null,
              designRoot: "docs/design",
            },
            assetSets: ["fixture"],
            assets: [
              {
                path: "docs/playbook/fixture.md",
                source,
                sha256: sha256(text),
                mode: 0o644,
                text: true,
              },
            ],
          },
        ];
      }),
    ),
  );
  const content = {
    schemaVersion: 1,
    standards,
    local: false,
    variants,
    runtime: { source: "apply.mjs", sha256: sha256(runtime) },
  };
  const assetDigest = sha256(JSON.stringify(content));
  await writeFixtureFile(exportRoot, "apply.mjs", runtime);
  await writeFixtureFile(exportRoot, "manifest.json", JSON.stringify({ ...content, assetDigest }));
  const pkg = { name: "__F7T_APP_NAME__", dependencies: { "fixture-dep": "1.0.0" } };
  const lock = '{"lockfileVersion":1,"fixture":true}\n';
  const entries = [
    { path: "base/package.json", bytes: JSON.stringify(pkg), text: true, mode: 0o644 },
    { path: "base/nested/gitignore", bytes: "node_modules\n", text: true, mode: 0o644 },
    { path: "base/nested/.keep", bytes: "", text: false, mode: 0o644 },
    {
      path: "base/scripts/check.sh",
      bytes: "#!/bin/sh\necho __F7T_APP_NAME__\n",
      text: true,
      mode: 0o755,
    },
    {
      path: "base/public/icon.png",
      bytes: Buffer.from([0xff, 0, 0x12, 0x95]),
      text: false,
      mode: 0o644,
    },
    { path: "base/NOTICE", bytes: "Synthetic fixture notice\n", text: true, mode: 0o644 },
    {
      path: "stacks/inertia-monolith/artisan",
      bytes: "#!/usr/bin/env php\n<?php // fixture\n",
      text: true,
      mode: 0o755,
    },
    {
      path: "stacks/api-next/services/api/composer.json",
      bytes: '{"require":{"php":"^8.4"}}',
      text: true,
      mode: 0o644,
    },
    { path: "locks/next.lock", bytes: lock, text: true, mode: 0o644 },
    { path: "shared/fixture.ts", bytes: "// Synthetic setup asset\n", text: true, mode: 0o644 },
  ];
  for (const entry of entries)
    await writeFixtureFile(template, entry.path, entry.bytes, entry.mode);
  const release: ReleaseManifest = {
    schemaVersion: 1,
    status: "release",
    generatorVersion: "0.0.0-fixture",
    templateRevision: "2".repeat(40),
    standards: { ...standards, assetDigest },
    templates: {
      "next-only": { root: "base" },
      "inertia-monolith": { root: "stacks/inertia-monolith" },
      "api-next": { root: "stacks/api-next" },
    },
    assets: entries.map(({ path: file, bytes, text, mode }) => ({
      path: file,
      sha256: sha256(bytes),
      text,
      mode,
    })),
    locks: [
      {
        key: compositionKey({ stack: "next-only", data: "none" }),
        manifests: { "package.json": dependencyDigest(pkg) },
        files: [{ source: "locks/next.lock", destination: "bun.lock", sha256: sha256(lock) }],
      },
    ],
  };
  await writeFixtureFile(template, "manifest.json", JSON.stringify(release));
  await writeFixtureFile(
    root,
    "package.json",
    JSON.stringify({
      name: "f7t-package-fixture",
      version: release.generatorVersion,
      type: "module",
      files: ["runner.mjs", "template"],
      bin: "runner.mjs",
    }),
  );
  return release;
}
