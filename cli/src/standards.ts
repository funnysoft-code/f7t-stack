import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertDistributableContent, assertDistributablePath, isTemplateText } from "./fs";
import { packageRoot, regularPackagePath, safeRelativePath } from "./paths";

export type StackVariant = "next-only" | "inertia-monolith" | "api-next";
export type Composition = Record<string, string | boolean | null>;
export type BundleAsset = { path: string; sha256: string; mode: number; text: boolean };
export type LockEntry = {
  key: string;
  manifests: Record<string, string>;
  files: Array<{ source: string; destination: string; sha256: string }>;
};
export type ReleaseManifest = {
  schemaVersion: 1;
  status: "release";
  generatorVersion: string;
  templateRevision: string;
  standards: { release: string; commit: string; assetDigest: string };
  templates: Record<StackVariant, { root: string }>;
  assets: BundleAsset[];
  locks: LockEntry[];
};
type ExportAsset = BundleAsset & { source: string };
type ExportManifest = {
  schemaVersion: number;
  local: boolean;
  standards: { release: string; commit: string };
  assetDigest: string;
  runtime: { source: string; sha256: string };
  variants: Record<StackVariant, { assets: ExportAsset[] }>;
};
const variants: StackVariant[] = ["next-only", "inertia-monolith", "api-next"];
export const sha256 = (bytes: string | Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const digestPattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const compareKeys = ([a]: [string, unknown], [b]: [string, unknown]): number =>
  a < b ? -1 : a > b ? 1 : 0;

function jsonFile<T>(root: string, relative: string): T {
  return JSON.parse(readFileSync(regularPackagePath(root, relative), "utf8")) as T;
}

function verifyBytes(root: string, relative: string, digest: string): Buffer {
  assertDistributablePath(relative);
  if (!digestPattern.test(digest)) throw new Error("Invalid expected asset digest");
  const file = regularPackagePath(root, relative);
  if (!lstatSync(file).isFile()) throw new Error(`Asset is not a file: ${relative}`);
  const bytes = readFileSync(file);
  if (sha256(bytes) !== digest) throw new Error(`Asset digest mismatch: ${relative}`);
  return bytes;
}

export function packageInventory(root: string): string[] {
  const files: string[] = [];
  function walk(relative: string) {
    const absolute = regularPackagePath(root, relative);
    const info = lstatSync(absolute);
    assertDistributablePath(relative, info.isDirectory());
    if (info.isDirectory()) {
      for (const name of readdirSync(absolute).sort()) walk(`${relative}/${name}`);
    } else {
      files.push(relative);
      assertDistributableContent(relative, readFileSync(absolute));
    }
  }
  for (const name of readdirSync(root).sort()) walk(name);
  return files;
}

/** Independent verifier: no code from the export runs until this succeeds. */
export function verifyStandardsBundle(exportRoot: string, expectedDigest: string): ExportManifest {
  if (!digestPattern.test(expectedDigest)) throw new Error("Invalid expected standards digest");
  const manifest = jsonFile<ExportManifest>(exportRoot, "manifest.json");
  const { assetDigest, ...content } = manifest;
  if (manifest.schemaVersion !== 1 || manifest.local !== false)
    throw new Error("Unsupported or local standards export");
  if (assetDigest !== expectedDigest || sha256(JSON.stringify(content)) !== expectedDigest)
    throw new Error("Standards export digest mismatch");
  if (
    !commitPattern.test(manifest.standards?.commit) ||
    !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.standards?.release)
  )
    throw new Error("Invalid immutable standards identity");
  if (manifest.runtime?.source !== "apply.mjs") throw new Error("Invalid standards runtime path");
  verifyBytes(exportRoot, manifest.runtime.source, manifest.runtime.sha256);
  const expected = new Set(["manifest.json", "apply.mjs"]);
  for (const variant of variants) {
    const assets = manifest.variants?.[variant]?.assets;
    if (!Array.isArray(assets) || !assets.length)
      throw new Error(`Missing standards variant: ${variant}`);
    const destinations = new Set<string>();
    for (const asset of assets) {
      assertDistributablePath(asset.path);
      safeRelativePath(asset.source);
      if (
        asset.source !== `variants/${variant}/files/${asset.path}` ||
        destinations.has(asset.path) ||
        ["STANDARDS_VERSION", "STANDARDS_MANIFEST.json", "F7T_MANIFEST.json"].includes(asset.path)
      )
        throw new Error("Invalid or duplicate standards asset path");
      if (![0o644, 0o755].includes(asset.mode) || typeof asset.text !== "boolean")
        throw new Error("Invalid standards asset policy");
      destinations.add(asset.path);
      expected.add(asset.source);
      const bytes = verifyBytes(exportRoot, asset.source, asset.sha256);
      if (asset.text) {
        if (bytes.includes(0)) throw new Error("Binary standards text asset");
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      }
    }
  }
  for (const file of packageInventory(exportRoot))
    if (!expected.has(file)) throw new Error(`Undeclared standards asset: ${file}`);
  return manifest;
}

export function verifyReleaseBundle(root = packageRoot()): ReleaseManifest {
  const release = jsonFile<ReleaseManifest>(root, "template/manifest.json");
  if (release.schemaVersion !== 1 || release.status !== "release")
    throw new Error("Release bundle is pending U14 inventory, standards pin and lock catalog");
  if (
    !commitPattern.test(release.templateRevision) ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.generatorVersion)
  )
    throw new Error("Invalid generator/template identity");
  if (jsonFile<{ version: string }>(root, "package.json").version !== release.generatorVersion)
    throw new Error("Generator version mismatch");
  const template = regularPackagePath(root, "template");
  const standards = verifyStandardsBundle(
    regularPackagePath(template, "standards"),
    release.standards?.assetDigest,
  );
  if (
    standards.standards.commit !== release.standards.commit ||
    standards.standards.release !== release.standards.release
  )
    throw new Error("Standards identity mismatch");
  const expected = new Set<string>();
  if (!Array.isArray(release.assets) || !release.assets.length)
    throw new Error("Missing template inventory");
  for (const asset of release.assets) {
    if (
      expected.has(asset.path) ||
      asset.path === "manifest.json" ||
      asset.path.startsWith("standards/")
    )
      throw new Error("Invalid template inventory path");
    if (![0o644, 0o755].includes(asset.mode) || typeof asset.text !== "boolean")
      throw new Error("Invalid template asset policy");
    if (asset.text !== isTemplateText(asset.path))
      throw new Error(`Template text policy mismatch: ${asset.path}`);
    const bytes = verifyBytes(template, asset.path, asset.sha256);
    if (asset.text) {
      if (bytes.includes(0)) throw new Error("Binary template text asset");
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    if ((lstatSync(path.join(template, asset.path)).mode & 0o111) !== (asset.mode & 0o111))
      throw new Error(`Template mode mismatch: ${asset.path}`);
    expected.add(asset.path);
  }
  for (const file of packageInventory(template))
    if (file !== "manifest.json" && !file.startsWith("standards/") && !expected.has(file))
      throw new Error(`Undeclared template asset: ${file}`);
  for (const variant of variants) {
    const dir = safeRelativePath(release.templates?.[variant]?.root);
    if (![...expected].some((file) => file.startsWith(`${dir}/`)))
      throw new Error(`Missing template: ${variant}`);
  }
  if (!Array.isArray(release.locks) || !release.locks.length)
    throw new Error("Missing release lock catalog");
  const keys = new Set<string>();
  for (const lock of release.locks) {
    if (compositionKey(JSON.parse(lock.key)) !== lock.key)
      throw new Error("Noncanonical lock composition");
    if (keys.has(lock.key)) throw new Error("Duplicate lock composition");
    keys.add(lock.key);
    if (!lock.files.length || !Object.keys(lock.manifests).length)
      throw new Error("Empty lock composition");
    const destinations = new Set<string>();
    for (const [file, digest] of Object.entries(lock.manifests)) {
      safeRelativePath(file);
      if (!digestPattern.test(digest)) throw new Error("Invalid dependency manifest digest");
    }
    for (const file of lock.files) {
      assertDistributablePath(file.destination);
      if (!expected.has(file.source) || destinations.has(file.destination))
        throw new Error("Invalid lock catalog path");
      destinations.add(file.destination);
      verifyBytes(template, file.source, file.sha256);
    }
  }
  return release;
}

export function compositionKey(choices: Composition): string {
  if (
    !Object.keys(choices).length ||
    Object.values(choices).some(
      (value) => value !== null && typeof value !== "string" && typeof value !== "boolean",
    )
  )
    throw new Error("Invalid dependency composition");
  return JSON.stringify(Object.fromEntries(Object.entries(choices).sort(compareKeys)));
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(compareKeys)
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

/** Excludes the generated app name and scripts, retains dependency-affecting metadata. */
export function dependencyDigest(manifest: Record<string, unknown>): string {
  const fields = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
    "peerDependenciesMeta",
    "overrides",
    "resolutions",
    "workspaces",
    "trustedDependencies",
    "patchedDependencies",
    "engines",
    "packageManager",
    "require",
    "require-dev",
    "repositories",
    "config",
    "minimum-stability",
    "prefer-stable",
    "conflict",
    "replace",
    "provide",
    "extra",
  ];
  return sha256(
    JSON.stringify(
      canonical(
        Object.fromEntries(
          fields.filter((key) => Object.hasOwn(manifest, key)).map((key) => [key, manifest[key]]),
        ),
      ),
    ),
  );
}

export function selectReleaseLock(release: ReleaseManifest, choices: Composition): LockEntry {
  const matches = release.locks.filter((lock) => lock.key === compositionKey(choices));
  if (matches.length !== 1)
    throw new Error("No unique tested release lock for this dependency composition");
  return matches[0]!;
}

export async function applyReleaseLock(
  target: string,
  choices: Composition,
  root = packageRoot(),
): Promise<void> {
  const release = verifyReleaseBundle(root);
  const lock = selectReleaseLock(release, choices);
  for (const [file, digest] of Object.entries(lock.manifests))
    if (dependencyDigest(jsonFile(target, file)) !== digest)
      throw new Error(`Dependency composition mismatch: ${file}`);
  const writes = lock.files.map((file) => ({
    destination: regularPackagePath(target, file.destination, true),
    bytes: verifyBytes(path.join(root, "template"), file.source, file.sha256),
  }));
  for (const file of writes)
    if (lstatSync(file.destination, { throwIfNoEntry: false })?.isDirectory())
      throw new Error("Lock destination is a directory");
  for (const file of writes) {
    await mkdir(path.dirname(file.destination), { recursive: true });
    await writeFile(file.destination, file.bytes);
    await chmod(file.destination, 0o644);
  }
}

export async function applyBundledStandards(
  options: {
    target: string;
    variant: StackVariant;
    team: string;
    teamSlug: string;
    productBlurb: string;
  },
  root = packageRoot(),
): Promise<void> {
  const release = verifyReleaseBundle(root);
  const exportRoot = path.join(root, "template/standards");
  const runtime = await import(pathToFileURL(path.join(exportRoot, "apply.mjs")).href);
  runtime.verifyExport(exportRoot, release.standards.assetDigest);
  const receipt = regularPackagePath(options.target, "F7T_MANIFEST.json", true);
  if (lstatSync(receipt, { throwIfNoEntry: false })?.isDirectory())
    throw new Error("Generator receipt destination is a directory");
  runtime.applyExport({ ...options, exportRoot, expectedDigest: release.standards.assetDigest });
  await writeFile(
    receipt,
    `${JSON.stringify({ schemaVersion: 1, generatorVersion: release.generatorVersion, templateRevision: release.templateRevision, standards: release.standards, variant: options.variant }, null, 2)}\n`,
  );
}
