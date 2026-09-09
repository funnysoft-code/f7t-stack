import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FlagInput } from "./config";
import { resolveConfig } from "./config";
import { auditPackage } from "./package-build";
import { packageRoot } from "./paths";
import { runPrivate } from "./release-candidate";
import { generationMatrix, verifyCompleteCatalog } from "./release-matrix";
import { compositionKey, dependencyDigest, sha256, verifyReleaseBundle } from "./standards";
import { dependencyComposition, stacks, type StackId } from "./stacks";

function cliFlags(flags: FlagInput): string[] {
  return Object.entries(flags).flatMap(([key, value]) =>
    typeof value === "boolean" ? (value ? [`--${key}`] : []) : [`--${key}`, String(value)],
  );
}

export async function packedMatrix(options: {
  source: string;
  output: string;
  fixtureMode: boolean;
  install: boolean;
  stack?: StackId;
}): Promise<void> {
  const source = path.resolve(options.source);
  const output = path.resolve(options.output);
  const pkg = JSON.parse(await readFile(path.join(source, "package.json"), "utf8"));
  if ((pkg.private || /candidate|fixture/.test(pkg.version)) && !options.fixtureMode)
    throw new Error("Offline candidate requires explicit --fixture-mode");
  const release = verifyReleaseBundle(source);
  verifyCompleteCatalog(release);
  if (existsSync(output) || output === source || output.startsWith(`${source}${path.sep}`))
    throw new Error("Packed output must be a new directory outside the package");
  const files = auditPackage(source);
  await mkdir(output, { recursive: true });
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", output], {
      cwd: source,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  assert.deepEqual(packed[0].files.map((file: { path: string }) => file.path).sort(), files.sort());
  const archive = path.join(output, packed[0].filename);
  runPrivate("tar", ["-xzf", archive, "-C", output], output);
  const extracted = path.join(output, "package");
  verifyReleaseBundle(extracted);
  for (const file of files)
    assert.equal(
      sha256(await readFile(path.join(extracted, file))),
      sha256(await readFile(path.join(source, file))),
      `Packed bytes: ${file}`,
    );
  const binary = path.join(extracted, "create-f7t-app.js");
  assert.equal(
    (await readFile(binary, "utf8")).includes(packageRoot()),
    false,
    "Binary contains source checkout path",
  );
  const negativeResults: string[] = [];
  for (const fault of ["omitted-asset", "standards-digest", "incompatible-lock"] as const) {
    const relative =
      fault === "omitted-asset"
        ? `template/${release.assets.find((asset) => asset.path.endsWith(".woff2"))?.path ?? "base/package.json"}`
        : "template/manifest.json";
    const file = path.join(extracted, relative);
    const bytes = await readFile(file);
    try {
      if (fault === "omitted-asset") await rm(file);
      else {
        const altered = structuredClone(release);
        if (fault === "standards-digest") altered.standards.assetDigest = "0".repeat(64);
        else altered.locks[0]!.manifests["package.json"] = "0".repeat(64);
        await writeFile(file, JSON.stringify(altered));
      }
      const result = spawnSync(
        "node",
        [
          binary,
          `negative-${fault}`,
          "--yes",
          "--skip-install",
          "--no-git",
          "--json",
          "--stack",
          "next-only",
        ],
        { cwd: output, encoding: "utf8" },
      );
      assert.equal(result.status, 1, `${fault} must fail`);
      assert.equal(
        JSON.parse(result.stdout).status,
        "incomplete",
        `${fault} must not report readiness`,
      );
      negativeResults.push(fault);
    } finally {
      await writeFile(file, bytes);
      await rm(path.join(output, `negative-${fault}`), { recursive: true, force: true });
    }
  }
  verifyReleaseBundle(extracted);
  const receipts: Array<Record<string, unknown>> = [];
  const installed = new Set<string>();
  const cases = generationMatrix().filter(
    (flags) => !options.stack || flags.stack === options.stack,
  );
  for (const [index, flags] of cases.entries()) {
    const name = `fixture-${index}`;
    const config = resolveConfig({ ...flags, appName: name }, output);
    runPrivate(
      "node",
      [binary, name, "--yes", "--skip-install", "--no-git", "--json", ...cliFlags(flags)],
      output,
    );
    const target = config.projectDir;
    const key = compositionKey(dependencyComposition(config));
    const lock = release.locks.find((item) => item.key === key)!;
    for (const [file, digest] of Object.entries(lock.manifests))
      assert.equal(
        dependencyDigest(JSON.parse(await readFile(path.join(target, file), "utf8"))),
        digest,
      );
    for (const file of lock.files)
      assert.equal(sha256(await readFile(path.join(target, file.destination))), file.sha256);
    const receipt = JSON.parse(await readFile(path.join(target, "F7T_MANIFEST.json"), "utf8"));
    assert.deepEqual(receipt.standards, release.standards);
    assert.equal(existsSync(path.join(target, "opencode.json")), true);
    if (config.stack === "next-only") {
      assert.equal(existsSync(path.join(target, "composer.json")), false);
      assert.equal(existsSync(path.join(target, "artisan")), false);
    } else {
      const php = path.join(target, stacks[config.stack].phpRoot!);
      assert.match(
        await readFile(path.join(php, ".env.example"), "utf8"),
        /REGISTRATION_ENABLED=false/,
      );
    }
    let frozen = false;
    if (options.install && !installed.has(key)) {
      runPrivate("bun", ["install", "--frozen-lockfile"], target);
      const phpRoot = stacks[config.stack].phpRoot;
      if (phpRoot !== null) {
        const php = path.join(target, phpRoot);
        // Match guided setup: Composer's discovery hook boots the application.
        await cp(path.join(php, ".env.example"), path.join(php, ".env"));
        runPrivate("composer", ["install", "--no-interaction", "--prefer-dist"], php);
        runPrivate("composer", ["validate", "--strict", "--no-check-all"], php);
      }
      for (const file of lock.files)
        assert.equal(
          sha256(await readFile(path.join(target, file.destination))),
          file.sha256,
          "Frozen install changed lock",
        );
      installed.add(key);
      frozen = true;
    }
    receipts.push({ flags, key, target, frozenInstall: frozen, standards: receipt.standards });
    // Preserve the two installed Laravel fixtures for service and browser gates.
    if (config.stack === "next-only") await rm(target, { recursive: true, force: true });
    await writeFile(
      path.join(output, "matrix.json"),
      `${JSON.stringify({ status: options.fixtureMode ? "offline-candidate-not-published" : "packed-matrix", archiveSha256: sha256(await readFile(archive)), packageFiles: files.length, negativeResults, installedKeys: [...installed], receipts }, null, 2)}\n`,
    );
    console.log(
      `Packed ${index + 1}/${cases.length}${frozen ? " frozen installed" : " generated"}`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name: string) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? undefined : process.argv[index + 1];
  };
  try {
    const stack = arg("--stack");
    if (stack && !Object.hasOwn(stacks, stack)) throw new Error("Unknown matrix stack");
    const output = arg("--output");
    if (!output) throw new Error("--output is required");
    await packedMatrix({
      source: arg("--source") ?? packageRoot(),
      output,
      fixtureMode: process.argv.includes("--fixture-mode"),
      install: process.argv.includes("--install"),
      stack: stack as StackId | undefined,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Packed matrix failed");
    process.exitCode = 1;
  }
}
