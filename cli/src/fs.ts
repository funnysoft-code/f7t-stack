import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
  const entries = await readdir(fromAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "extra.json" || entry.name === "node_modules") {
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
