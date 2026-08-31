import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { appPagesRoot } from "./app-root";
import type { CreateConfig } from "./config";
import { htmlLang, templateDir } from "./paths";

function applyReplacements(content: string, replacements: Record<string, string>): string {
  let next = content;
  for (const [token, value] of Object.entries(replacements)) {
    next = next.split(token).join(value);
  }
  return next;
}

async function replaceInTree(dir: string, replacements: Record<string, string>): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") {
        continue;
      }
      await replaceInTree(abs, replacements);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const content = await readFile(abs, "utf8");
    const next = applyReplacements(content, replacements);
    if (next !== content) {
      await writeFile(abs, next, "utf8");
    }
  }
}

function extraRootSkip(fromAbs: string): Set<string> {
  const skip = new Set(["extra.json", "node_modules"]);
  const manifestPath = path.join(fromAbs, "extra.json");
  if (!existsSync(manifestPath)) {
    return skip;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
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
  const entries = await readdir(fromAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (skip.has(entry.name)) {
      continue;
    }
    const src = path.join(fromAbs, entry.name);
    const destRel =
      options.appPrefix && entry.name === "__app__" ? appPagesRoot(config) : entry.name;
    const dest = path.join(config.projectDir, destRel);
    if (entry.isDirectory()) {
      await copyTemplateDir(src, dest, replacements);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(src, dest);
    const content = await readFile(dest, "utf8");
    const next = applyReplacements(content, replacements);
    if (next !== content) {
      await writeFile(dest, next, "utf8");
    }
  }
}

async function promoteGitignore(dir: string): Promise<void> {
  const from = path.join(dir, "gitignore");
  const to = path.join(dir, ".gitignore");
  if (existsSync(from)) {
    await rename(from, to);
  }
}

export async function copyTemplateDir(
  fromAbs: string,
  toAbs: string,
  replacements: Record<string, string>,
): Promise<void> {
  await cp(fromAbs, toAbs, {
    recursive: true,
    filter: (src) => path.basename(src) !== "node_modules",
  });
  await replaceInTree(toAbs, replacements);
  await promoteGitignore(toAbs);
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
