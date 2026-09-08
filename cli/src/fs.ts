import { existsSync, readFileSync } from "node:fs";
import { chmod, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { appPagesRoot } from "./app-root";
import type { CreateConfig } from "./config";
import { htmlLang, regularPackagePath, safeRelativePath, templateDir } from "./paths";

function applyReplacements(content: string, replacements: Record<string, string>): string {
  let next = content;
  for (const [token, value] of Object.entries(replacements)) {
    next = next.split(token).join(value);
  }
  return next;
}

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".txt",
  ".css",
  ".scss",
  ".html",
  ".svg",
  ".yml",
  ".yaml",
  ".toml",
  ".xml",
  ".php",
  ".sh",
  ".bash",
  ".lock",
  ".sql",
]);
const textNames = new Set([
  "gitignore",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".env.example",
  "LICENSE",
  "NOTICE",
  "artisan",
  "Dockerfile",
  "STANDARDS_VERSION",
]);

export function isTemplateText(relative: string): boolean {
  return textNames.has(path.basename(relative)) || textExtensions.has(path.extname(relative));
}

export function assertDistributablePath(relative: string, isDirectory = false): void {
  safeRelativePath(relative);
  const forbidden = new Set([
    "node_modules",
    "vendor",
    ".git",
    ".next",
    ".turbo",
    ".cache",
    "coverage",
    "dist",
    ".DS_Store",
    "auth.json",
    ".npmrc",
    ".netrc",
    ".ssh",
    ".vercel",
    ".envrc",
    ".f7t-setup-state.json",
  ]);
  const runtimeFile =
    !isDirectory &&
    !["gitignore", ".gitignore"].includes(path.basename(relative)) &&
    /(?:^|\/)(?:storage\/(?:logs|framework)|bootstrap\/cache|public\/build)\//.test(relative);
  if (
    relative
      .split("/")
      .some(
        (part) =>
          forbidden.has(part) ||
          (part.startsWith(".env") && part !== ".env.example") ||
          /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db|tgz|zip|tar|gz|phar|pem|key|p12|log)$/i.test(part),
      ) ||
    runtimeFile
  ) {
    throw new Error(`Forbidden distributable path: ${relative}`);
  }
}

export function assertDistributableContent(relative: string, bytes: Buffer): void {
  if (/(?:^|\/)(?:composer\.(?:json|lock)|package\.json|bun\.lock)$/.test(relative)) {
    const text = bytes.toString("utf8");
    if (
      /https?:\/\/[^\s/"@]+@|[?&](?:token|key|auth|password|signature)=|"(?:http-basic|bearer|github-oauth)"\s*:/i.test(
        text,
      )
    )
      throw new Error(`Credential-bearing dependency metadata: ${relative}`);
  }
}

type CopyEntry = { relative: string; bytes: Buffer; mode: number };

async function collectTemplate(
  from: string,
  replacements: Record<string, string>,
  skip = new Set<string>(),
  mapRoot: (name: string) => string = (name) => name,
): Promise<CopyEntry[]> {
  const writes: CopyEntry[] = [];
  const seen = new Set<string>();
  async function visit(relative: string) {
    const source = regularPackagePath(from, relative);
    const info = await lstat(source);
    assertDistributablePath(relative, info.isDirectory());
    if (info.isDirectory()) {
      for (const name of (await readdir(source)).sort()) await visit(`${relative}/${name}`);
      return;
    }
    const parts = relative.split("/");
    parts[0] = mapRoot(parts[0]!);
    if (parts.at(-1) === "gitignore") parts[parts.length - 1] = ".gitignore";
    const destination = safeRelativePath(parts.join("/"));
    if (seen.has(destination)) throw new Error(`Duplicate template destination: ${destination}`);
    seen.add(destination);
    let bytes = await readFile(source);
    assertDistributableContent(relative, bytes);
    if (isTemplateText(relative)) {
      if (bytes.includes(0)) throw new Error(`Binary bytes in declared text: ${relative}`);
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      bytes = Buffer.from(applyReplacements(text, replacements));
    }
    writes.push({ relative: destination, bytes, mode: info.mode & 0o111 ? 0o755 : 0o644 });
  }
  for (const name of (await readdir(from)).sort()) if (!skip.has(name)) await visit(name);
  return writes;
}

async function writeTemplate(target: string, writes: CopyEntry[]): Promise<void> {
  for (const item of writes) {
    const dest = regularPackagePath(target, item.relative, true);
    if (existsSync(dest) && (await lstat(dest)).isDirectory())
      throw new Error(`Target is a directory: ${item.relative}`);
  }
  for (const item of writes) {
    const dest = path.join(target, item.relative);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, item.bytes);
    await chmod(dest, item.mode);
  }
}

function extraRootSkip(fromAbs: string): Set<string> {
  const skip = new Set(["extra.json", "node_modules"]);
  const manifestPath = path.join(fromAbs, "extra.json");
  if (!existsSync(manifestPath)) {
    return skip;
  }
  const manifest = JSON.parse(readFileSync(regularPackagePath(fromAbs, "extra.json"), "utf8")) as {
    globalsCss?: string;
    skip?: string[];
  };
  if (manifest.globalsCss) {
    skip.add(path.basename(manifest.globalsCss));
  }
  if (manifest.skip) {
    for (const name of manifest.skip) {
      skip.add(name);
    }
  }
  return skip;
}

function extraReplacements(config: CreateConfig): Record<string, string> {
  return {
    __F7T_APP_NAME__: config.appName,
    __F7T_LOCALE__: config.locale,
    __F7T_HTML_LANG__: htmlLang(config),
  };
}

export async function copyExtra(
  name: string,
  config: CreateConfig,
  options: { appPrefix?: boolean } = {},
): Promise<void> {
  const fromAbs = templateDir("extras", name);
  if (!existsSync(fromAbs)) {
    throw new Error(`Missing extra directory: ${name}`);
  }
  const replacements = extraReplacements(config);
  const skip = extraRootSkip(fromAbs);
  const writes = await collectTemplate(fromAbs, replacements, skip, (name) =>
    options.appPrefix && name === "__app__" ? appPagesRoot(config) : name,
  );
  await writeTemplate(config.projectDir, writes);
}

export async function copyTemplateDir(
  fromAbs: string,
  toAbs: string,
  replacements: Record<string, string>,
): Promise<void> {
  await writeTemplate(toAbs, await collectTemplate(fromAbs, replacements));
}

export async function mergePackageJson(
  projectDir: string,
  patch: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  },
): Promise<void> {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  if (patch.dependencies) {
    pkg.dependencies = { ...pkg.dependencies, ...patch.dependencies };
  }
  if (patch.devDependencies) {
    pkg.devDependencies = { ...pkg.devDependencies, ...patch.devDependencies };
  }
  if (patch.scripts) {
    pkg.scripts = { ...pkg.scripts, ...patch.scripts };
  }
  for (const field of ["dependencies", "devDependencies"] as const) {
    if (pkg[field]) {
      pkg[field] = Object.fromEntries(
        Object.entries(pkg[field]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
  }
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

export async function appendGlobalsCss(projectDir: string, snippet: string): Promise<void> {
  const block = snippet.trim();
  if (block.length === 0) {
    return;
  }
  const cssPath = path.join(projectDir, "src/app/globals.css");
  const current = existsSync(cssPath) ? await readFile(cssPath, "utf8") : "";
  if (current.includes(block)) {
    return;
  }
  const prefix = current.length === 0 || current.endsWith("\n") ? current : `${current}\n`;
  await writeFile(cssPath, `${prefix}${block}\n`);
}

export async function appendEnvExample(
  projectDir: string,
  entries: Array<{ key: string; example: string }>,
): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  const envPath = path.join(projectDir, ".env.example");
  const current = existsSync(envPath) ? await readFile(envPath, "utf8") : "";
  const block = entries.map((entry) => `${entry.key}=${entry.example}`).join("\n");
  const prefix = current.length === 0 || current.endsWith("\n") ? current : `${current}\n`;
  await writeFile(envPath, `${prefix}${block}\n`);
}
