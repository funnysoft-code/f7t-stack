import { execFileSync } from "node:child_process";
import { chmod, cp, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveConfig } from "./config";
import { writeEnv } from "./env-file";
import { copyTemplateDir, isTemplateText } from "./fs";
import { runInstallers } from "./installers";
import { packageRoot } from "./paths";
import { dependencyMatrix } from "./release-matrix";
import {
  dependencyDigest,
  packageInventory,
  sha256,
  verifyReleaseBundle,
  verifyStandardsBundle,
  type ReleaseManifest,
} from "./standards";
import { stacks } from "./stacks";

/** Package commands may emit auth details. Record only the command and exit status. */
export function runPrivate(command: string, args: string[], cwd: string): void {
  try {
    execFileSync(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], timeout: 600_000 });
  } catch {
    throw new Error(`${command} ${args.join(" ")} failed in ${cwd}; output withheld`);
  }
}

export async function inventory(template: string): Promise<ReleaseManifest["assets"]> {
  return Promise.all(
    packageInventory(template)
      .filter((file) => file !== "manifest.json" && !file.startsWith("standards/"))
      .map(async (file) => ({
        path: file,
        sha256: sha256(await readFile(path.join(template, file))),
        mode: (await lstat(path.join(template, file))).mode & 0o111 ? 0o755 : 0o644,
        text: isTemplateText(file),
      })),
  );
}

export type CandidateInput = {
  output: string;
  exportRoot: string;
  digest: string;
  templateRevision: string;
  fixtureMode: boolean;
};

/** Offline preparation only. Never edits the source manifest or assigns a published identity. */
export async function prepareCandidate(input: CandidateInput): Promise<void> {
  if (!input.fixtureMode)
    throw new Error(
      "Candidate preparation requires --fixture-mode; production release approval belongs to the coordinator",
    );
  await prepareBundle(input);
}

/** The coordinator supplies the published identity after checking its tag and commit. */
export async function prepareRelease(
  input: Omit<CandidateInput, "fixtureMode"> & {
    standardsRelease: string;
    standardsCommit: string;
  },
): Promise<void> {
  const exported = verifyStandardsBundle(input.exportRoot, input.digest);
  if (
    exported.standards.release !== input.standardsRelease ||
    exported.standards.commit !== input.standardsCommit
  )
    throw new Error("Published standards identity does not match the supplied export");
  await prepareBundle({ ...input, fixtureMode: false });
}

async function prepareBundle(input: CandidateInput): Promise<void> {
  if (!/^(?:[a-f0-9]{40}|\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.test(input.templateRevision))
    throw new Error("Expected full template commit or generator release version");
  const source = packageRoot();
  const output = path.resolve(input.output);
  if (output === source || output.startsWith(`${source}${path.sep}`) || existsSync(output))
    throw new Error("Candidate output must be a new directory outside the checkout");
  const exported = verifyStandardsBundle(input.exportRoot, input.digest);
  await mkdir(output, { recursive: true });
  const bundle = path.join(output, "bundle");
  const template = path.join(bundle, "template");
  // Inventory before copying rejects dependencies, runtime files and symlinks.
  packageInventory(path.join(source, "template"));
  await cp(path.join(source, "template"), template, { recursive: true });
  await cp(input.exportRoot, path.join(template, "standards"), { recursive: true });
  for (const file of ["README.md", "LICENSE", "package.json"])
    await cp(path.join(source, file), path.join(bundle, file));
  const pkg = JSON.parse(await readFile(path.join(bundle, "package.json"), "utf8"));
  if (input.fixtureMode) {
    pkg.version = `${pkg.version}-u14-candidate`;
    pkg.private = true;
    pkg.scripts = {
      prepublishOnly: "node -e \"throw new Error('Offline candidate must not be published')\"",
    };
  }
  await writeFile(path.join(bundle, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  runPrivate(
    "bun",
    [
      "build",
      path.join(source, "cli/src/index.ts"),
      "--outfile",
      path.join(bundle, "create-f7t-app.js"),
      "--target",
      "node",
      "--format",
      "esm",
    ],
    source,
  );
  await chmod(path.join(bundle, "create-f7t-app.js"), 0o755);
  const runtime = await import(pathToFileURL(path.join(input.exportRoot, "apply.mjs")).href);
  const manifest: ReleaseManifest = {
    schemaVersion: 1,
    status: "release",
    generatorVersion: pkg.version,
    templateRevision: input.templateRevision,
    standards: { ...exported.standards, assetDigest: input.digest },
    templates: {
      "next-only": { root: "base" },
      "inertia-monolith": { root: "stacks/inertia-monolith" },
      "api-next": { root: "stacks/api-next" },
    },
    assets: [],
    locks: [],
  };
  for (const [index, { key, flags }] of dependencyMatrix().entries()) {
    const config = resolveConfig(
      { ...flags, appName: `composition-${index}`, git: false, skipInstall: true },
      path.join(output, "compositions"),
    );
    const target = config.projectDir;
    const definition = stacks[config.stack];
    await copyTemplateDir(path.join(template, definition.templateRoot), target, {
      __F7T_APP_NAME__: config.appName,
      __F7T_LOCALE__: config.locale,
      __F7T_HTML_LANG__: config.locale,
    });
    if (config.stack === "next-only") {
      await runInstallers(config);
      await writeEnv(config);
    }
    runtime.applyExport({
      target,
      variant: config.stack,
      team: "FunnySoft",
      teamSlug: "funnysoft",
      productBlurb: input.fixtureMode
        ? "U14 offline candidate"
        : "Release composition verification",
      exportRoot: input.exportRoot,
      expectedDigest: input.digest,
    });
    const manifests = [
      "package.json",
      ...(config.stack === "api-next"
        ? definition.jsRoots.map((root) => `${root}/package.json`)
        : []),
    ];
    const locks = ["bun.lock"];
    if (definition.phpRoot !== null) {
      const prefix = definition.phpRoot === "." ? "" : `${definition.phpRoot}/`;
      manifests.push(`${prefix}composer.json`);
      locks.push(`${prefix}composer.lock`);
      // Existing application Composer locks are authoritative, never composer update.
      runPrivate(
        "composer",
        ["validate", "--strict", "--no-check-all"],
        path.join(target, definition.phpRoot),
      );
    }
    runPrivate("bun", ["install", "--lockfile-only"], target);
    const entry: ReleaseManifest["locks"][number] = { key, manifests: {}, files: [] };
    for (const file of manifests)
      entry.manifests[file] = dependencyDigest(
        JSON.parse(await readFile(path.join(target, file), "utf8")),
      );
    for (const destination of locks) {
      const bytes = await readFile(path.join(target, destination));
      const relative = `locks/${sha256(key).slice(0, 16)}/${destination}`;
      await mkdir(path.dirname(path.join(template, relative)), { recursive: true });
      await writeFile(path.join(template, relative), bytes);
      entry.files.push({ source: relative, destination, sha256: sha256(bytes) });
    }
    manifest.locks.push(entry);
    console.log(`Prepared ${index + 1}/66 ${key}`);
  }
  manifest.assets = await inventory(template);
  await writeFile(path.join(template, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  verifyReleaseBundle(bundle);
  await writeFile(
    path.join(output, input.fixtureMode ? "candidate.json" : "release-preparation.json"),
    `${JSON.stringify({ status: input.fixtureMode ? "offline-candidate-not-published" : "release-bundle-prepared-not-published", sourceRevision: input.templateRevision, standards: manifest.standards, bundle, compositions: dependencyMatrix(), frozenInstall: "pending packed matrix" }, null, 2)}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name: string) => {
    const index = process.argv.indexOf(name);
    const value = index < 0 ? undefined : process.argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
    return value;
  };
  try {
    const input = {
      output: arg("--output"),
      exportRoot: arg("--standards-export"),
      digest: arg("--digest"),
      templateRevision: arg("--template-revision"),
      fixtureMode: process.argv.includes("--fixture-mode"),
    };
    if (process.argv.includes("--release")) {
      if (input.fixtureMode) throw new Error("Release preparation cannot enable fixture mode");
      await prepareRelease({
        ...input,
        standardsRelease: arg("--standards-release"),
        standardsCommit: arg("--standards-commit"),
      });
    } else await prepareCandidate(input);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Candidate preparation failed");
    process.exitCode = 1;
  }
}
