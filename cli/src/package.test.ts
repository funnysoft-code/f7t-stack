import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { auditPackage } from "./package-build";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import { packageRoot } from "./paths";
import { packageInventory } from "./standards";

const temps: string[] = [];
afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function temporary() {
  const root = await mkdtemp(path.join(os.tmpdir(), "f7t-pack-"));
  temps.push(root);
  return root;
}

async function packRunner(source: string, destination: string, runner: string) {
  await writeFixtureFile(source, "entry.ts", runner);
  execFileSync(
    "bun",
    [
      "build",
      path.join(source, "entry.ts"),
      "--outfile",
      path.join(source, "runner.mjs"),
      "--target",
      "node",
      "--format",
      "esm",
    ],
    { stdio: "pipe" },
  );
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", destination], {
      cwd: source,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ) as Array<{ filename: string; files: Array<{ path: string }> }>;
  execFileSync("tar", ["-xzf", path.join(destination, packed[0]!.filename), "-C", destination]);
  await rm(source, { recursive: true, force: true });
  const extracted = path.join(destination, "package");
  const script = path.join(extracted, "runner.mjs");
  expect(await readFile(script, "utf8")).not.toContain(packageRoot());
  return { extracted, script, files: packed[0]!.files.map((file) => file.path) };
}

test("real package inventory retains every Next template asset and excludes development files", () => {
  const files = auditPackage();
  expect(files).toContain("template/base/package.json");
  expect(files).toContain("template/base/gitignore");
  expect(files).toContain("template/PROVENANCE.md");
  expect(files).toContain("template/CLI-NOTICES.txt");
  expect(files.some((file) => file.startsWith("cli/"))).toBe(false);
});

test("Git ignore rules retain every release asset while excluding local OpenCode state", async () => {
  const root = await temporary();
  execFileSync("git", ["init", "--quiet", root]);
  await writeFixtureFile(
    root,
    ".gitignore",
    await readFile(path.join(packageRoot(), ".gitignore"), "utf8"),
  );
  const ignored = execFileSync(
    "git",
    ["-c", "core.excludesFile=/dev/null", "check-ignore", "--no-index", "--stdin"],
    {
      cwd: root,
      input: [...auditPackage(), ".opencode/local-state.json"].join("\n") + "\n",
      encoding: "utf8",
    },
  )
    .trim()
    .split("\n");
  expect(ignored).toEqual([".opencode/local-state.json"]);
});

test("package audit fails when npm omits an existing template asset", async () => {
  const root = await temporary();
  await writeFixtureFile(
    root,
    "package.json",
    JSON.stringify({
      name: "omission-fixture",
      version: "0.0.0",
      bin: "./create-f7t-app.js",
      files: ["create-f7t-app.js"],
    }),
  );
  for (const file of ["create-f7t-app.js", "README.md", "LICENSE", "template/base/omitted.txt"])
    await writeFixtureFile(root, file, "fixture");
  expect(() => auditPackage(root)).toThrow("Missing packaged asset: template/base/omitted.txt");
});

test.each([
  "vendor/private/package.php",
  ".env.local",
  "auth.json",
  "private.zip",
  "storage/logs/laravel.log",
  "bootstrap/cache/config.php",
  "node_modules/pkg/index.js",
])("inventory rejects %s", async (file) => {
  const root = await temporary();
  await writeFixtureFile(root, file, "fixture");
  expect(() => packageInventory(root)).toThrow(/Forbidden/);
});

test("dependency inventory rejects authenticated URLs without echoing credentials", async () => {
  const root = await temporary();
  await writeFixtureFile(
    root,
    "composer.lock",
    JSON.stringify({ url: "https://fixture-user:fixture-password@example.invalid/package" }),
  );
  expect(() => packageInventory(root)).toThrow(
    "Credential-bearing dependency metadata: composer.lock",
  );
});

test("packed fixture generates all layouts outside checkout with locks, notices, modes and binary bytes", async () => {
  const source = await temporary();
  const destination = await temporary();
  await releaseFixture(source);
  const runner = `import { copyTemplateDir } from ${JSON.stringify(path.join(packageRoot(), "cli/src/fs.ts"))};
import { verifyReleaseBundle, applyBundledStandards, applyReleaseLock } from ${JSON.stringify(path.join(packageRoot(), "cli/src/standards.ts"))};
import { packageRoot } from ${JSON.stringify(path.join(packageRoot(), "cli/src/paths.ts"))};
import path from 'node:path';
const root = packageRoot();
const release = verifyReleaseBundle(root);
const target = process.argv[2];
const variant = process.argv[3];
await copyTemplateDir(path.join(root, 'template', release.templates[variant].root), target, { __F7T_APP_NAME__: 'packed-demo' });
await applyBundledStandards({ target, variant, team: 'Packed', teamSlug: 'packed', productBlurb: 'Packed fixture' }, root);
if (variant === 'next-only') await applyReleaseLock(target, { stack: variant, data: 'none' }, root);
`;
  const { files, extracted, script } = await packRunner(source, destination, runner);
  expect(files).toContain("template/base/nested/.keep");
  expect(files).toContain("template/standards/apply.mjs");
  for (const variant of ["next-only", "inertia-monolith", "api-next"]) {
    execFileSync(process.execPath, [script, path.join(destination, variant), variant], {
      cwd: destination,
      stdio: "pipe",
    });
    expect(
      await readFile(path.join(destination, variant, "docs/playbook/fixture.md"), "utf8"),
    ).toContain(`# Packed\n${variant}`);
  }
  const app = path.join(destination, "next-only");
  expect(await readFile(path.join(app, "public/icon.png"))).toEqual(
    Buffer.from([0xff, 0, 0x12, 0x95]),
  );
  expect(await readFile(path.join(app, "nested/.gitignore"), "utf8")).toBe("node_modules\n");
  expect(await readFile(path.join(app, "NOTICE"), "utf8")).toContain("Synthetic fixture notice");
  expect(await readFile(path.join(app, "package.json"), "utf8")).not.toContain("__F7T_APP_NAME__");
  expect((await stat(path.join(app, "scripts/check.sh"))).mode & 0o111).toBe(0o111);
  expect(await readFile(path.join(app, "bun.lock"), "utf8")).toContain("lockfileVersion");
  await writeFixtureFile(
    extracted,
    "template/standards/apply.mjs",
    "throw new Error('must not execute');",
  );
  const failed = path.join(destination, "tampered-output");
  expect(() =>
    execFileSync(process.execPath, [script, failed, "next-only"], {
      cwd: destination,
      stdio: "pipe",
    }),
  ).toThrow();
  await expect(stat(failed)).rejects.toMatchObject({ code: "ENOENT" });
}, 30_000);

test("existing Next base and site extra copy from a packed artifact outside the repository", async () => {
  const source = await temporary();
  const destination = await temporary();
  for (const relative of ["base", "extras/shell-site"]) {
    await cp(
      path.join(packageRoot(), "template", relative),
      path.join(source, "template", relative),
      { recursive: true },
    );
  }
  await writeFixtureFile(
    source,
    "package.json",
    JSON.stringify({
      name: "f7t-existing-next-fixture",
      version: "0.0.0",
      type: "module",
      files: ["runner.mjs", "template"],
    }),
  );
  const runner = `import { copyTemplateDir, copyExtra } from ${JSON.stringify(path.join(packageRoot(), "cli/src/fs.ts"))};
import { templateDir } from ${JSON.stringify(path.join(packageRoot(), "cli/src/paths.ts"))};
const target = process.argv[2];
const config = { projectDir: target, appName: 'packed-site', locale: 'en', intl: false };
await copyTemplateDir(templateDir('base'), target, { __F7T_APP_NAME__: 'packed-site', __F7T_LOCALE__: 'en', __F7T_HTML_LANG__: 'en' });
await copyExtra('shell-site', config, { appPrefix: true });
`;
  const { script } = await packRunner(source, destination, runner);
  const target = path.join(destination, "site");
  execFileSync(process.execPath, [script, target], { cwd: destination, stdio: "pipe" });
  expect(JSON.parse(await readFile(path.join(target, "package.json"), "utf8")).name).toBe(
    "packed-site",
  );
  expect(await readFile(path.join(target, "src/app/page.tsx"), "utf8")).toContain("header");
  expect(await readFile(path.join(target, "src/app/layout.tsx"), "utf8")).not.toContain("__F7T_");
  await expect(stat(path.join(target, ".gitignore"))).resolves.toBeTruthy();
  await expect(stat(path.join(target, ".env.example"))).resolves.toBeTruthy();
}, 30_000);
