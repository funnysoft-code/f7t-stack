#!/usr/bin/env node
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/sisteransi/src/index.js
var require_src = __commonJS(function(exports, module) {
  var ESC2 = "\x1B";
  var CSI2 = `${ESC2}[`;
  var beep = "\x07";
  var cursor = {
    to(x, y) {
      if (!y)
        return `${CSI2}${x + 1}G`;
      return `${CSI2}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI2}${-x}D`;
      else if (x > 0)
        ret += `${CSI2}${x}C`;
      if (y < 0)
        ret += `${CSI2}${-y}A`;
      else if (y > 0)
        ret += `${CSI2}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI2}${count}A`,
    down: (count = 1) => `${CSI2}${count}B`,
    forward: (count = 1) => `${CSI2}${count}C`,
    backward: (count = 1) => `${CSI2}${count}D`,
    nextLine: (count = 1) => `${CSI2}E`.repeat(count),
    prevLine: (count = 1) => `${CSI2}F`.repeat(count),
    left: `${CSI2}G`,
    hide: `${CSI2}?25l`,
    show: `${CSI2}?25h`,
    save: `${ESC2}7`,
    restore: `${ESC2}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI2}S`.repeat(count),
    down: (count = 1) => `${CSI2}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI2}2J`,
    up: (count = 1) => `${CSI2}1J`.repeat(count),
    down: (count = 1) => `${CSI2}J`.repeat(count),
    line: `${CSI2}2K`,
    lineEnd: `${CSI2}K`,
    lineStart: `${CSI2}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// cli/src/index.ts
import path9 from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// cli/src/config.ts
import path from "node:path";

// cli/src/stacks.ts
var STACK_IDS = ["next-only", "inertia-monolith", "api-next"];
var nextOnlyOptions = ["shell", "data", "db", "intl", "locale", "resend"];
var stacks = {
  "next-only": {
    label: "Next.js only",
    templateRoot: "base",
    jsRoots: ["."],
    phpRoot: null,
    rejectedOptions: [],
    setupEntryPoint: "bun run setup"
  },
  "inertia-monolith": {
    label: "Laravel + Inertia + React",
    templateRoot: "stacks/inertia-monolith",
    jsRoots: ["."],
    phpRoot: ".",
    rejectedOptions: nextOnlyOptions,
    setupEntryPoint: "bun run setup"
  },
  "api-next": {
    label: "Laravel API + Next.js",
    templateRoot: "stacks/api-next",
    jsRoots: ["apps/web", "packages/api-client", "packages/design-system"],
    phpRoot: "services/api",
    rejectedOptions: nextOnlyOptions,
    setupEntryPoint: "bun run setup"
  }
};
function dependencyComposition(config) {
  if (config.stack !== "next-only")
    return { stack: config.stack };
  return {
    stack: config.stack,
    data: config.data,
    db: config.data === "drizzle" ? config.db : null,
    shadcn: config.shadcn,
    playwright: config.playwright,
    resend: config.resend,
    intl: config.intl
  };
}

// cli/src/config.ts
var YES_DEFAULTS = {
  stack: "next-only",
  shell: "site",
  data: "none",
  db: "sqlite",
  shadcn: false,
  playwright: false,
  resend: false,
  intl: false,
  locale: "pt-PT",
  harness: "opencode",
  githubActions: true,
  git: true,
  skipInstall: false,
  force: false
};
var SHELLS = ["site", "app"];
var DATAS = ["none", "sanity", "drizzle"];
var DBS = ["sqlite", "postgres"];
var LOCALES = ["en", "pt-PT"];
function takeValue(flag, argv, index) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}
function takeEnum(flag, value, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(`${flag} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}
function parseArgv(argv) {
  const input = {};
  let positionalName;
  const seen = new Set;
  for (let i = 0;i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }
    const key = arg === "--no-git" ? "--git" : arg;
    if (arg.startsWith("--") && seen.has(key)) {
      throw new Error("Repeated or conflicting flags are not supported; provide each option once");
    }
    seen.add(key);
    switch (arg) {
      case "--stack":
        input.stack = takeEnum(arg, takeValue(arg, argv, i), STACK_IDS);
        i++;
        break;
      case "--json":
        input.json = true;
        break;
      case "--help":
        input.help = true;
        break;
      case "--app-name": {
        input.appName = takeValue(arg, argv, i);
        i++;
        break;
      }
      case "--shell": {
        input.shell = takeEnum(arg, takeValue(arg, argv, i), SHELLS);
        i++;
        break;
      }
      case "--data": {
        input.data = takeEnum(arg, takeValue(arg, argv, i), DATAS);
        i++;
        break;
      }
      case "--db": {
        input.db = takeEnum(arg, takeValue(arg, argv, i), DBS);
        i++;
        break;
      }
      case "--harness": {
        if (takeValue(arg, argv, i) !== "opencode") {
          throw new Error("OpenCode is mandatory; remove the old --harness flag or use --harness opencode");
        }
        input.harness = "opencode";
        i++;
        break;
      }
      case "--locale": {
        input.locale = takeEnum(arg, takeValue(arg, argv, i), LOCALES);
        i++;
        break;
      }
      case "--shadcn":
        input.shadcn = true;
        break;
      case "--playwright":
        input.playwright = true;
        break;
      case "--resend":
        input.resend = true;
        break;
      case "--intl":
        input.intl = true;
        break;
      case "--yes":
        input.yes = true;
        break;
      case "--CI":
        input.yes = true;
        input.ci = true;
        break;
      case "--force":
        input.force = true;
        break;
      case "--skip-install":
        input.skipInstall = true;
        break;
      case "--git":
        input.git = true;
        break;
      case "--no-git":
        input.git = false;
        break;
      case "--github-actions":
        input.githubActions = true;
        break;
      case "--no-github-actions":
      case "--no-opencode":
      case "--no-quality":
      case "--no-shadcn":
        throw new Error("OpenCode, applicable shadcn and quality workflows are mandatory; remove policy-off flags");
      default: {
        if (arg.startsWith("-")) {
          throw new Error("Unknown flag; run --help for supported options");
        }
        if (positionalName === undefined) {
          positionalName = arg;
        } else {
          throw new Error("Provide only one app name");
        }
      }
    }
  }
  if (input.appName !== undefined && positionalName !== undefined && input.appName !== positionalName) {
    throw new Error("Conflicting app names; use a positional name or --app-name");
  }
  if (input.appName === undefined && positionalName !== undefined) {
    input.appName = positionalName;
  }
  return input;
}
function resolveConfig(input, cwd = process.cwd()) {
  validateOptions(input);
  if ((input.yes || input.ci) && input.appName === undefined) {
    throw new Error("--app-name is required with --yes or --CI");
  }
  if (input.appName === undefined) {
    throw new Error("--app-name is required");
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(input.appName)) {
    throw new Error("App name must use lowercase letters, numbers, hyphens or underscores, and start with a letter or number");
  }
  const common = {
    appName: input.appName,
    projectDir: path.resolve(cwd, input.appName),
    harness: "opencode",
    githubActions: true,
    git: input.git ?? true,
    skipInstall: input.skipInstall ?? false,
    force: input.force ?? false
  };
  if (input.stack && input.stack !== "next-only") {
    return {
      ...common,
      stack: input.stack,
      shell: "app",
      locale: "en",
      db: "postgres",
      intl: false,
      shadcn: true,
      playwright: true,
      resend: true
    };
  }
  const config = {
    ...YES_DEFAULTS,
    ...common
  };
  if (input.shell !== undefined)
    config.shell = input.shell;
  if (input.data !== undefined)
    config.data = input.data;
  if (input.db !== undefined)
    config.db = input.db;
  if (input.shadcn !== undefined)
    config.shadcn = input.shadcn;
  if (input.playwright !== undefined)
    config.playwright = input.playwright;
  if (input.resend !== undefined)
    config.resend = input.resend;
  if (input.intl !== undefined)
    config.intl = input.intl;
  if (input.locale !== undefined)
    config.locale = input.locale;
  if (config.intl) {
    config.locale = "en";
  }
  if (config.data !== "drizzle") {
    config.db = "sqlite";
  }
  return config;
}
function validateOptions(input) {
  const stack = input.stack ?? "next-only";
  takeEnum("--stack", stack, STACK_IDS);
  if (input.harness !== undefined && input.harness !== "opencode")
    throw new Error("OpenCode is mandatory; remove the old --harness flag or use --harness opencode");
  if (input.githubActions === false)
    throw new Error("Quality workflows are mandatory; remove --no-github-actions");
  for (const option of stacks[stack].rejectedOptions) {
    if (input[option] !== undefined)
      throw new Error(`--${option} is Next-only; Laravel uses a fixed English account app with PostgreSQL and prewired Resend`);
  }
  if (stack !== "next-only" && (input.shadcn === false || input.playwright === false))
    throw new Error("Laravel shadcn and browser quality checks are mandatory");
  if (input.shell !== undefined)
    takeEnum("--shell", input.shell, SHELLS);
  if (input.data !== undefined)
    takeEnum("--data", input.data, DATAS);
  if (input.db !== undefined)
    takeEnum("--db", input.db, DBS);
  if (input.locale !== undefined)
    takeEnum("--locale", input.locale, LOCALES);
}

// cli/src/create-app.ts
import { lstat as lstat3, mkdir as mkdir4, readdir as readdir2 } from "node:fs/promises";
import path8 from "node:path";

// cli/src/env-file.ts
import { writeFile as writeFile3 } from "node:fs/promises";
import path5 from "node:path";

// cli/src/installers.ts
import { existsSync as existsSync3, readFileSync as readFileSync2 } from "node:fs";
import { readFile as readFile2, rename, unlink, writeFile as writeFile2 } from "node:fs/promises";
import path4 from "node:path";

// cli/src/app-root.ts
function appPagesRoot(config) {
  return config.intl ? "src/app/[locale]" : "src/app";
}

// cli/src/fs.ts
import { existsSync as existsSync2, readFileSync } from "node:fs";
import { chmod, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path3 from "node:path";

// cli/src/paths.ts
import { existsSync, lstatSync } from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
function packageRoot() {
  let dir = path2.dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(path2.join(dir, "template", "base", "package.json"))) {
      return dir;
    }
    const parent = path2.dirname(dir);
    if (parent === dir) {
      throw new Error("Could not find package root (template/base/package.json)");
    }
    dir = parent;
  }
}
function templateDir(...parts) {
  const relative = parts.join("/");
  if (relative)
    safeRelativePath(relative);
  return path2.join(packageRoot(), "template", ...parts);
}
function safeRelativePath(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes("\x00") || /^[A-Za-z]:/.test(value) || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid package-relative path");
  }
  return value;
}
function regularPackagePath(root, relative, allowMissing = false) {
  safeRelativePath(relative);
  let cursor = path2.resolve(root);
  const parts = ["", ...relative.split("/")];
  for (const [index, part] of parts.entries()) {
    cursor = path2.join(cursor, part);
    const info = lstatSync(cursor, { throwIfNoEntry: false });
    if (!info) {
      if (allowMissing)
        continue;
      throw new Error(`Missing package asset: ${relative}`);
    }
    if (info.isSymbolicLink())
      throw new Error(`Symlink package path: ${relative}`);
    if (index < parts.length - 1 && !info.isDirectory())
      throw new Error(`Invalid package directory: ${relative}`);
    if (index === parts.length - 1 && !info.isFile() && !info.isDirectory())
      throw new Error(`Invalid package file: ${relative}`);
  }
  return cursor;
}
function htmlLang(config) {
  return config.intl ? "en" : config.locale;
}

// cli/src/fs.ts
function applyReplacements(content, replacements) {
  let next = content;
  for (const [token, value] of Object.entries(replacements)) {
    next = next.split(token).join(value);
  }
  return next;
}
var textExtensions = new Set([
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
  ".sql"
]);
var textNames = new Set([
  "gitignore",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".env.example",
  "LICENSE",
  "NOTICE",
  "artisan",
  "Dockerfile",
  "STANDARDS_VERSION"
]);
function isTemplateText(relative) {
  return textNames.has(path3.basename(relative)) || textExtensions.has(path3.extname(relative));
}
function assertDistributablePath(relative, isDirectory = false) {
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
    ".f7t-setup-state.json"
  ]);
  const runtimeFile = !isDirectory && !["gitignore", ".gitignore"].includes(path3.basename(relative)) && /(?:^|\/)(?:storage\/(?:logs|framework)|bootstrap\/cache|public\/build)\//.test(relative);
  if (relative.split("/").some((part) => forbidden.has(part) || part.startsWith(".env") && part !== ".env.example" || /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db|tgz|zip|tar|gz|phar|pem|key|p12|log)$/i.test(part)) || runtimeFile) {
    throw new Error(`Forbidden distributable path: ${relative}`);
  }
}
function assertDistributableContent(relative, bytes) {
  if (/(?:^|\/)(?:composer\.(?:json|lock)|package\.json|bun\.lock)$/.test(relative)) {
    const text = bytes.toString("utf8");
    if (/https?:\/\/[^\s/"@]+@|[?&](?:token|key|auth|password|signature)=|"(?:http-basic|bearer|github-oauth)"\s*:/i.test(text))
      throw new Error(`Credential-bearing dependency metadata: ${relative}`);
  }
}
async function collectTemplate(from, replacements, skip = new Set, mapRoot = (name) => name) {
  const writes = [];
  const seen = new Set;
  async function visit(relative) {
    const source = regularPackagePath(from, relative);
    const info = await lstat(source);
    assertDistributablePath(relative, info.isDirectory());
    if (info.isDirectory()) {
      for (const name of (await readdir(source)).sort())
        await visit(`${relative}/${name}`);
      return;
    }
    const parts = relative.split("/");
    parts[0] = mapRoot(parts[0]);
    if (parts.at(-1) === "gitignore")
      parts[parts.length - 1] = ".gitignore";
    const destination = safeRelativePath(parts.join("/"));
    if (seen.has(destination))
      throw new Error(`Duplicate template destination: ${destination}`);
    seen.add(destination);
    let bytes = await readFile(source);
    assertDistributableContent(relative, bytes);
    if (isTemplateText(relative)) {
      if (bytes.includes(0))
        throw new Error(`Binary bytes in declared text: ${relative}`);
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      bytes = Buffer.from(applyReplacements(text, replacements));
    }
    writes.push({ relative: destination, bytes, mode: info.mode & 73 ? 493 : 420 });
  }
  for (const name of (await readdir(from)).sort())
    if (!skip.has(name))
      await visit(name);
  return writes;
}
async function writeTemplate(target, writes) {
  for (const item of writes) {
    const dest = regularPackagePath(target, item.relative, true);
    if (existsSync2(dest) && (await lstat(dest)).isDirectory())
      throw new Error(`Target is a directory: ${item.relative}`);
  }
  for (const item of writes) {
    const dest = path3.join(target, item.relative);
    await mkdir(path3.dirname(dest), { recursive: true });
    await writeFile(dest, item.bytes);
    await chmod(dest, item.mode);
  }
}
function extraRootSkip(fromAbs) {
  const skip = new Set(["extra.json", "node_modules"]);
  const manifestPath = path3.join(fromAbs, "extra.json");
  if (!existsSync2(manifestPath)) {
    return skip;
  }
  const manifest = JSON.parse(readFileSync(regularPackagePath(fromAbs, "extra.json"), "utf8"));
  if (manifest.globalsCss) {
    skip.add(path3.basename(manifest.globalsCss));
  }
  if (manifest.skip) {
    for (const name of manifest.skip) {
      skip.add(name);
    }
  }
  return skip;
}
function extraReplacements(config) {
  return {
    __F7T_APP_NAME__: config.appName,
    __F7T_LOCALE__: config.locale,
    __F7T_HTML_LANG__: htmlLang(config)
  };
}
async function copyExtra(name, config, options = {}) {
  const fromAbs = templateDir("extras", name);
  if (!existsSync2(fromAbs)) {
    throw new Error(`Missing extra directory: ${name}`);
  }
  const replacements = extraReplacements(config);
  const skip = extraRootSkip(fromAbs);
  const writes = await collectTemplate(fromAbs, replacements, skip, (name2) => options.appPrefix && name2 === "__app__" ? appPagesRoot(config) : name2);
  await writeTemplate(config.projectDir, writes);
}
async function copyTemplateDir(fromAbs, toAbs, replacements) {
  await writeTemplate(toAbs, await collectTemplate(fromAbs, replacements));
}
async function mergePackageJson(projectDir, patch) {
  const pkgPath = path3.join(projectDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  if (patch.dependencies) {
    pkg.dependencies = { ...pkg.dependencies, ...patch.dependencies };
  }
  if (patch.devDependencies) {
    pkg.devDependencies = { ...pkg.devDependencies, ...patch.devDependencies };
  }
  if (patch.scripts) {
    pkg.scripts = { ...pkg.scripts, ...patch.scripts };
  }
  for (const field of ["dependencies", "devDependencies"]) {
    if (pkg[field]) {
      pkg[field] = Object.fromEntries(Object.entries(pkg[field]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    }
  }
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}
`);
}
async function appendGlobalsCss(projectDir, snippet) {
  const block = snippet.trim();
  if (block.length === 0) {
    return;
  }
  const cssPath = path3.join(projectDir, "src/app/globals.css");
  const current = existsSync2(cssPath) ? await readFile(cssPath, "utf8") : "";
  if (current.includes(block)) {
    return;
  }
  const prefix = current.length === 0 || current.endsWith(`
`) ? current : `${current}
`;
  await writeFile(cssPath, `${prefix}${block}
`);
}
async function appendEnvExample(projectDir, entries) {
  if (entries.length === 0) {
    return;
  }
  const envPath = path3.join(projectDir, ".env.example");
  const current = existsSync2(envPath) ? await readFile(envPath, "utf8") : "";
  const block = entries.map((entry) => `${entry.key}=${entry.example}`).join(`
`);
  const prefix = current.length === 0 || current.endsWith(`
`) ? current : `${current}
`;
  await writeFile(envPath, `${prefix}${block}
`);
}

// cli/src/installers.ts
async function runShell(name, config) {
  await copyExtra(name, config, { appPrefix: true });
  if (config.intl) {
    const page = path4.join(config.projectDir, appPagesRoot(config), "page.tsx");
    await writeFile2(page, (await readFile2(page, "utf8")).replace('import Link from "next/link";', 'import { Link } from "~/i18n/navigation";'));
  }
}
async function runExtra(name, config, options = {}) {
  await copyExtra(name, config, options);
  const manifest = readExtraManifest(name);
  if (manifest.package) {
    await mergePackageJson(config.projectDir, manifest.package);
  }
  if (manifest.env) {
    await appendEnvExample(config.projectDir, manifest.env);
  }
  if (manifest.globalsCss) {
    const snippetPath = path4.join(templateDir("extras", name), manifest.globalsCss);
    await appendGlobalsCss(config.projectDir, readFileSync2(snippetPath, "utf8"));
  }
}
function contactPath(config) {
  return !config.intl && config.locale === "pt-PT" ? "contacto" : "contact";
}
async function runResend(config) {
  await runExtra("resend", config, { appPrefix: true });
  const dest = contactPath(config);
  const root = path4.join(config.projectDir, appPagesRoot(config));
  if (dest !== "contact") {
    await rename(path4.join(root, "contact"), path4.join(root, dest));
  }
  if (!config.intl) {
    return;
  }
  const from = path4.join(templateDir("extras", "resend"), "intl-contact-page.tsx");
  const content = await readFile2(from, "utf8");
  await writeFile2(path4.join(root, dest, "page.tsx"), content.split("__F7T_APP_NAME__").join(config.appName));
}
async function runNextIntl(config) {
  await runExtra("next-intl", config);
  await unlink(path4.join(config.projectDir, "src/app/page.tsx"));
  const studioDir = path4.join(config.projectDir, "src/app/studio");
  if (!existsSync3(studioDir)) {
    return;
  }
  await writeFile2(path4.join(studioDir, "layout.tsx"), `export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);
}
function readExtraManifest(extraName) {
  const manifestPath = path4.join(templateDir("extras", extraName), "extra.json");
  if (!existsSync3(manifestPath)) {
    return {};
  }
  return JSON.parse(readFileSync2(manifestPath, "utf8"));
}
var installers = [
  {
    name: "sanity",
    shouldRun: (config) => config.data === "sanity",
    run: (config) => runExtra("sanity", config)
  },
  {
    name: "drizzle-sqlite",
    shouldRun: (config) => config.data === "drizzle" && config.db === "sqlite",
    run: (config) => runExtra("drizzle-sqlite", config)
  },
  {
    name: "drizzle-postgres",
    shouldRun: (config) => config.data === "drizzle" && config.db === "postgres",
    run: (config) => runExtra("drizzle-postgres", config)
  },
  {
    name: "next-intl",
    shouldRun: (config) => config.intl,
    run: (config) => runNextIntl(config)
  },
  {
    name: "shell-site",
    shouldRun: (config) => config.shell === "site",
    run: (config) => runShell("shell-site", config)
  },
  {
    name: "shell-app",
    shouldRun: (config) => config.shell === "app",
    run: (config) => runShell("shell-app", config)
  },
  {
    name: "shadcn",
    shouldRun: (config) => config.shadcn,
    run: (config) => runExtra("shadcn", config)
  },
  {
    name: "resend",
    shouldRun: (config) => config.resend,
    run: (config) => runResend(config)
  },
  {
    name: "playwright",
    shouldRun: (config) => config.playwright,
    run: (config) => runExtra("playwright", config)
  }
];
function landedExtras(config) {
  return installers.filter((installer) => installer.shouldRun(config)).map((installer) => ({
    name: installer.name,
    manifest: readExtraManifest(installer.name)
  }));
}
async function runInstallers(config) {
  if (config.stack !== "next-only")
    throw new Error("Next installers require the next-only stack");
  for (const installer of installers) {
    if (installer.shouldRun(config)) {
      await installer.run(config);
    }
  }
  const entry = [
    ...config.data === "sanity" ? ["src/sanity/lib/site-settings.ts"] : [],
    ...config.data === "drizzle" ? ["src/server/db/index.ts", "src/server/db/schema.ts"] : [],
    ...config.shadcn ? ["src/components/ui/button.tsx"] : [],
    ...config.intl ? ["src/i18n/navigation.ts"] : []
  ];
  if (entry.length) {
    const inline = `[${entry.map((file) => JSON.stringify(file)).join(", ")}]`;
    const formatted = inline.length + '  "entry": '.length <= 100 ? inline : `[
${entry.map((file) => `    ${JSON.stringify(file)}`).join(`,
`)}
  ]`;
    await writeFile2(path4.join(config.projectDir, "knip.json"), `{
  "entry": ${formatted}
}
`);
  }
}

// cli/src/env-file.ts
var BASE_SITE_URL = {
  key: "NEXT_PUBLIC_SITE_URL",
  side: "client",
  zod: "z.url()",
  example: "http://localhost:3000"
};
function extraEnv(config) {
  return landedExtras(config).flatMap((extra) => extra.manifest.env ?? []);
}
function renderFields(entries) {
  return entries.map((entry) => `    ${entry.key}: ${entry.value},`).join(`
`);
}
async function writeEnv(config) {
  const extra = extraEnv(config);
  const server = [
    { key: "NODE_ENV", value: 'z.enum(["development", "test", "production"])' },
    ...extra.filter((entry) => entry.side === "server").map((entry) => ({ key: entry.key, value: entry.zod }))
  ];
  const client = [
    { key: BASE_SITE_URL.key, value: BASE_SITE_URL.zod },
    ...extra.filter((entry) => entry.side === "client").map((entry) => ({ key: entry.key, value: entry.zod }))
  ];
  const runtime = [...server, ...client].map((entry) => `    ${entry.key}: process.env.${entry.key},`);
  const envJs = `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
${renderFields(server)}
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * \`NEXT_PUBLIC_\`.
   */
  client: {
${renderFields(client)}
  },

  /**
   * You can't destruct \`process.env\` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
${runtime.join(`
`)}
  },
  /**
   * Run \`build\` or \`dev\` with \`SKIP_ENV_VALIDATION\` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. \`SOME_VAR: z.string()\` and
   * \`SOME_VAR=''\` will throw an error.
   */
  emptyStringAsUndefined: true,
});
`;
  await writeFile3(path5.join(config.projectDir, "src/env.js"), envJs);
  const dotenv = [
    `${BASE_SITE_URL.key}=${BASE_SITE_URL.example}`,
    ...extra.map((entry) => `${entry.key}=${entry.example}`)
  ].join(`
`);
  const dotenvText = `${dotenv}
`;
  await writeFile3(path5.join(config.projectDir, ".env.example"), dotenvText);
  await writeFile3(path5.join(config.projectDir, ".env"), dotenvText);
}

// cli/src/git.ts
import { spawn } from "node:child_process";
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "ignore", env: process.env });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
async function initGit(dir) {
  try {
    if (await run("git", ["--version"], dir) !== 0) {
      console.warn("Git is not installed. Skipping git init.");
      return;
    }
  } catch {
    console.warn("Git is not installed. Skipping git init.");
    return;
  }
  try {
    if (await run("git", ["init"], dir) !== 0) {
      console.warn("git init failed. Skipping.");
    }
  } catch {
    console.warn("Git is not installed. Skipping git init.");
  }
}

// template/shared/setup-runtime.ts
import { createHash } from "node:crypto";
import { lstat as lstat2, mkdir as mkdir2, readFile as readFile3, writeFile as writeFile4 } from "node:fs/promises";
import path6 from "node:path";

// template/shared/prerequisites.ts
import { spawn as spawn2 } from "node:child_process";
var runCommand = (command, cwd) => new Promise((resolve, reject) => {
  const child = spawn2(command[0], command.slice(1), {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "ignore"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    if (output.length < 65536)
      output += chunk.toString();
  });
  child.on("error", () => reject(new Error("Command unavailable")));
  child.on("close", (code) => code === 0 ? resolve(output.trim()) : reject(new Error("Command failed")));
});
async function checkPrerequisites(stack, cwd, run2 = runCommand) {
  const check = async (command, valid, guidance) => {
    try {
      if (valid(await run2(command, cwd)))
        return;
    } catch {}
    throw new Error(guidance);
  };
  await check(["bun", "--version"], (value) => /^(1\.(?:[4-9]|[1-9]\d+)\.|[2-9]\.)/.test(value), "Install bun >=1.4 before rerunning setup.");
  if (stack === "next-only")
    return;
  await check(["composer", "--version"], (value) => /Composer version 2\./.test(value), "Install composer 2 and configure private package access outside this project.");
  const compatible = (value) => Number(value) >= 80500 && Number(value) < 90000;
  await check(["php", "-r", "echo PHP_VERSION_ID;"], compatible, "Select php 8.5 or newer PHP 8.x for the CLI.");
  await check(["herd", "php", "-r", "echo PHP_VERSION_ID;"], compatible, "Install herd and select PHP 8.5 for this site: herd isolate 8.5.");
  const extensions = [
    "ctype",
    "curl",
    "dom",
    "fileinfo",
    "filter",
    "hash",
    "intl",
    "mbstring",
    "openssl",
    "pcntl",
    "pdo_pgsql",
    "redis",
    "session",
    "tokenizer",
    "xml",
    "zlib"
  ];
  for (const prefix of [["php"], ["herd", "php"]]) {
    await check([
      ...prefix,
      "-r",
      `foreach (${JSON.stringify(extensions).replaceAll('"', "'")} as $extension) { if (!extension_loaded($extension)) exit(1); }`
    ], () => true, `${prefix.join(" ")} needs extensions: ${extensions.join(", ")}. Enable them for the CLI and Herd site, then rerun setup.`);
  }
}

// template/shared/install.ts
async function installDeps(projectDir, run2 = runCommand) {
  await run2(["bun", "install", "--frozen-lockfile"], projectDir);
}

// template/shared/setup-runtime.ts
function projectDatabase(root) {
  const slug = path6.basename(root).toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 35);
  return `f7t_${slug}_${createHash("sha256").update(path6.resolve(root)).digest("hex").slice(0, 8)}`;
}
async function preserveEnvironment(directory, database) {
  const target = path6.join(directory, ".env");
  try {
    const info = await lstat2(target);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("Environment must be a regular file");
    return;
  } catch (error) {
    if (error.code !== "ENOENT")
      throw error;
  }
  let example = await readFile3(path6.join(directory, ".env.example"), "utf8");
  if (database) {
    example = example.replace(/^DB_DATABASE=.*$/m, `DB_DATABASE=${database}`).replace(/^REDIS_PREFIX=.*$/m, `REDIS_PREFIX=${database}:`).replace(/^HORIZON_PREFIX=.*$/m, `HORIZON_PREFIX=${database}:horizon:`).replace(/^REDIS_QUEUE=.*$/m, `REDIS_QUEUE=${database}`);
  }
  await writeFile4(target, example, { flag: "wx", mode: 384 });
}
var guidance = {
  prerequisites: "Check Bun, Composer, PHP extensions and the Herd site's PHP version.",
  environment: "Provide regular .env.example files and preserve your existing .env values.",
  "javascript-dependencies": "Check network access and the committed Bun lockfile. Rerun with bun run setup.",
  "php-dependencies": "Check network access, composer.lock and preconfigured Composer credentials. For API + Next, authorized Scramble Pro access is mandatory.",
  platform: "Enable the extensions and PHP version required by composer.lock in both CLI and Herd.",
  boost: "Check Boost guideline/skill installation in the PHP root and the root skill-sync script. Rerun setup after restoring installed formatting tools and package access.",
  services: "Check PostgreSQL authentication, Redis and Herd SMTP at the hosts and ports in .env. Herd defaults: 5432, 6138, 2525; set REDIS_PORT=6379 if your Valkey uses it.",
  "application-key": "Check .env permissions. Existing application keys must remain unchanged.",
  database: "Setup only creates its dedicated project database. Check DB_DATABASE and database creation permission; never point setup at a shared database.",
  migrations: "Check the database connection. Inspect php artisan migrate in the Laravel root, then rerun setup. Existing rows are preserved.",
  contracts: "Check route/schema generation and private package access, then rerun setup."
};
async function initializeProject(root, stack, options = {}) {
  const run2 = options.run ?? runCommand;
  const phpRoot = stack === "api-next" ? path6.join(root, "services/api") : root;
  const completedStages = [];
  let failedStage = "prerequisites";
  const stage = async (name, action) => {
    failedStage = name;
    await action();
    completedStages.push(name);
  };
  let result;
  try {
    await stage("prerequisites", () => checkPrerequisites(stack, phpRoot, run2));
    await stage("environment", async () => {
      await preserveEnvironment(phpRoot, stack === "next-only" ? undefined : projectDatabase(root));
      if (stack === "api-next")
        await preserveEnvironment(path6.join(root, "apps/web"));
    });
    await stage("javascript-dependencies", async () => {
      const lock = await lstat2(path6.join(root, "bun.lock"));
      if (!lock.isFile() || lock.isSymbolicLink())
        throw new Error("A regular Bun release lock is required");
      await installDeps(root, run2);
    });
    const pkg = JSON.parse(await readFile3(path6.join(root, "package.json"), "utf8"));
    if (stack !== "next-only") {
      await stage("php-dependencies", async () => {
        const lock = await lstat2(path6.join(phpRoot, "composer.lock"));
        if (!lock.isFile() || lock.isSymbolicLink())
          throw new Error("A regular Composer release lock is required");
        await run2(["composer", "validate", "--strict", "--no-check-all"], phpRoot);
        await run2(["composer", "install", "--no-interaction", "--prefer-dist"], phpRoot);
      });
      await stage("platform", async () => {
        await run2(["composer", "check-platform-reqs"], phpRoot);
        await run2(["herd", "composer", "check-platform-reqs"], phpRoot);
      });
      await stage("boost", async () => {
        await run2(["php", "artisan", "boost:install", "--guidelines", "--skills", "--no-interaction"], phpRoot);
        await run2(["bash", "scripts/boost-sync-opencode-skills.sh"], root);
      });
      const helper = path6.join(root, "scripts/setup.php");
      await stage("services", () => run2(["php", helper, "services", projectDatabase(root)], phpRoot));
      await stage("application-key", async () => {
        const env = await readFile3(path6.join(phpRoot, ".env"), "utf8");
        if (!/^APP_KEY=(?!["']?["']?\s*$).+/m.test(env))
          await run2(["php", "artisan", "key:generate", "--no-interaction"], phpRoot);
      });
      await stage("database", () => run2(["php", helper, "database", projectDatabase(root)], phpRoot));
      await stage("migrations", () => run2(["php", "artisan", "migrate", "--no-interaction"], phpRoot));
      await stage("contracts", async () => {
        if (stack === "api-next")
          await run2(["bun", "run", "api:generate"], root);
        else {
          await run2(["php", "artisan", "wayfinder:generate", "--with-form"], phpRoot);
          await run2(["php", "artisan", "typescript:transform"], phpRoot);
        }
      });
    } else if (pkg.scripts?.["db:migrate"]) {
      await stage("migrations", async () => {
        await run2(["bun", "run", "db:generate"], root);
        await run2(["bun", "run", "db:migrate"], root);
      });
    }
    const manual = pkg.dependencies?.sanity ? ["connect-sanity"] : [];
    if (stack === "next-only" && pkg.dependencies?.resend)
      manual.push("connect-resend");
    result = {
      status: manual.length ? "setup-pending" : "initialized",
      stack,
      failedStage: null,
      completedStages,
      pendingSteps: [...manual, "start-processes", "browser-verification"],
      recovery: "bun run setup",
      message: manual.length ? "Local initialization complete. External provider connection remains pending." : "Initialized and ready to start. Application processes and browser journeys have not been verified."
    };
  } catch (error) {
    const hint = failedStage === "migrations" && stack === "next-only" ? "Check DATABASE_URL and bun run db:migrate. Start the generated PostgreSQL service with docker compose up -d when applicable, then rerun setup. Existing rows are preserved." : guidance[failedStage] ?? "Check local configuration and rerun setup.";
    result = {
      status: "incomplete",
      stack,
      failedStage,
      completedStages,
      pendingSteps: [failedStage, "local-setup", "browser-verification"],
      recovery: "bun run setup",
      message: `Setup incomplete at ${failedStage}. ${failedStage === "prerequisites" && error instanceof Error ? error.message : hint}`
    };
  }
  const state = path6.join(root, ".f7t");
  await mkdir2(state, { recursive: true });
  await writeFile4(path6.join(state, "setup-state.json"), `${JSON.stringify(result, null, 2)}
`, {
    mode: 384
  });
  return result;
}
// cli/src/standards.ts
import { createHash as createHash2 } from "node:crypto";
import { lstatSync as lstatSync2, readFileSync as readFileSync3, readdirSync } from "node:fs";
import { mkdir as mkdir3, writeFile as writeFile6, chmod as chmod2 } from "node:fs/promises";
import path7 from "node:path";
import { pathToFileURL } from "node:url";

// cli/src/agents.ts
import { writeFile as writeFile5 } from "node:fs/promises";
async function writeProjectBrief(options) {
  const definition = stacks[options.variant];
  const php = definition.phpRoot;
  const design = options.variant === "next-only" ? null : options.variant === "api-next" ? "packages/design-system/DESIGN.md" : "design/DESIGN.md";
  const lines = [
    "# Project brief",
    "",
    options.productBlurb.replace(/[\r\n]+/g, " "),
    "",
    "Before work, read the applicable `.opencode/rules/*.md` files and the pinned `docs/playbook/README.md`.",
    "",
    `Stack: ${definition.label}. JS roots: ${definition.jsRoots.map((root) => `\`${root}\``).join(", ")}.`,
    "Standards identity: `STANDARDS_VERSION` and `STANDARDS_MANIFEST.json`. Generator identity: `F7T_MANIFEST.json`.",
    ...design ? [`Design authority: \`${design}\`.`] : [],
    "",
    "Run `bun run check` from the repository root. Install the locked dependencies before running gates. Run `bun run hooks:install` after Git initialization.",
    ...php ? [
      `PHP root: \`${php}\`. Run Composer and Artisan there.`,
      "After `php artisan boost:update --ansi`, run `bash scripts/boost-sync-opencode-skills.sh` from the repository root. Root `.opencode/skills` contains portable real files.",
      "Boost may append guidelines to this brief; retain its policy-entry instruction."
    ] : [],
    ...options.variant === "api-next" ? [
      "After API contract changes, run `bun run api:generate`. `bun run check:schema` compares a fresh Laravel export and generated types; `bun run check:workflows` validates `tests/workflows.yml` against tagged `e2e/` journeys."
    ] : [],
    "",
    "Keep product decisions in repository docs. Never commit secrets or copy personal OpenCode providers, models, permissions, or global configuration.",
    ""
  ];
  await writeFile5(regularPackagePath(options.target, "AGENTS.md", true), lines.join(`
`));
}

// cli/src/standards.ts
var variants = ["next-only", "inertia-monolith", "api-next"];
var sha256 = (bytes) => createHash2("sha256").update(bytes).digest("hex");
var digestPattern = /^[a-f0-9]{64}$/;
var commitPattern = /^[a-f0-9]{40}$/;
var compareKeys = ([a], [b]) => a < b ? -1 : a > b ? 1 : 0;
function jsonFile(root, relative) {
  return JSON.parse(readFileSync3(regularPackagePath(root, relative), "utf8"));
}
function verifyBytes(root, relative, digest) {
  assertDistributablePath(relative);
  if (!digestPattern.test(digest))
    throw new Error("Invalid expected asset digest");
  const file = regularPackagePath(root, relative);
  if (!lstatSync2(file).isFile())
    throw new Error(`Asset is not a file: ${relative}`);
  const bytes = readFileSync3(file);
  if (sha256(bytes) !== digest)
    throw new Error(`Asset digest mismatch: ${relative}`);
  return bytes;
}
function packageInventory(root) {
  const files = [];
  function walk(relative) {
    const absolute = regularPackagePath(root, relative);
    const info = lstatSync2(absolute);
    assertDistributablePath(relative, info.isDirectory());
    if (info.isDirectory()) {
      for (const name of readdirSync(absolute).sort())
        walk(`${relative}/${name}`);
    } else {
      files.push(relative);
      assertDistributableContent(relative, readFileSync3(absolute));
    }
  }
  for (const name of readdirSync(root).sort())
    walk(name);
  return files;
}
function verifyStandardsBundle(exportRoot, expectedDigest) {
  if (!digestPattern.test(expectedDigest))
    throw new Error("Invalid expected standards digest");
  const manifest = jsonFile(exportRoot, "manifest.json");
  const { assetDigest, ...content } = manifest;
  if (manifest.schemaVersion !== 1 || manifest.local !== false)
    throw new Error("Unsupported or local standards export");
  if (assetDigest !== expectedDigest || sha256(JSON.stringify(content)) !== expectedDigest)
    throw new Error("Standards export digest mismatch");
  if (!commitPattern.test(manifest.standards?.commit) || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.standards?.release))
    throw new Error("Invalid immutable standards identity");
  if (manifest.runtime?.source !== "apply.mjs")
    throw new Error("Invalid standards runtime path");
  verifyBytes(exportRoot, manifest.runtime.source, manifest.runtime.sha256);
  const expected = new Set(["manifest.json", "apply.mjs"]);
  for (const variant of variants) {
    const assets = manifest.variants?.[variant]?.assets;
    if (!Array.isArray(assets) || !assets.length)
      throw new Error(`Missing standards variant: ${variant}`);
    const destinations = new Set;
    for (const asset of assets) {
      assertDistributablePath(asset.path);
      safeRelativePath(asset.source);
      if (asset.source !== `variants/${variant}/files/${asset.path}` || destinations.has(asset.path) || ["STANDARDS_VERSION", "STANDARDS_MANIFEST.json", "F7T_MANIFEST.json"].includes(asset.path))
        throw new Error("Invalid or duplicate standards asset path");
      if (![420, 493].includes(asset.mode) || typeof asset.text !== "boolean")
        throw new Error("Invalid standards asset policy");
      destinations.add(asset.path);
      expected.add(asset.source);
      const bytes = verifyBytes(exportRoot, asset.source, asset.sha256);
      if (asset.text) {
        if (bytes.includes(0))
          throw new Error("Binary standards text asset");
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      }
    }
  }
  for (const file of packageInventory(exportRoot))
    if (!expected.has(file))
      throw new Error(`Undeclared standards asset: ${file}`);
  return manifest;
}
function verifyReleaseBundle(root = packageRoot()) {
  const release = jsonFile(root, "template/manifest.json");
  if (release.schemaVersion !== 1 || release.status !== "release")
    throw new Error("Release bundle is pending U14 inventory, standards pin and lock catalog");
  if (!commitPattern.test(release.templateRevision) && release.templateRevision !== release.generatorVersion || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.generatorVersion))
    throw new Error("Invalid generator/template identity");
  if (jsonFile(root, "package.json").version !== release.generatorVersion)
    throw new Error("Generator version mismatch");
  const template = regularPackagePath(root, "template");
  const standards = verifyStandardsBundle(regularPackagePath(template, "standards"), release.standards?.assetDigest);
  if (standards.standards.commit !== release.standards.commit || standards.standards.release !== release.standards.release)
    throw new Error("Standards identity mismatch");
  const expected = new Set;
  if (!Array.isArray(release.assets) || !release.assets.length)
    throw new Error("Missing template inventory");
  for (const asset of release.assets) {
    if (expected.has(asset.path) || asset.path === "manifest.json" || asset.path.startsWith("standards/"))
      throw new Error("Invalid template inventory path");
    if (![420, 493].includes(asset.mode) || typeof asset.text !== "boolean")
      throw new Error("Invalid template asset policy");
    if (asset.text !== isTemplateText(asset.path))
      throw new Error(`Template text policy mismatch: ${asset.path}`);
    const bytes = verifyBytes(template, asset.path, asset.sha256);
    if (asset.text) {
      if (bytes.includes(0))
        throw new Error("Binary template text asset");
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    if ((lstatSync2(path7.join(template, asset.path)).mode & 73) !== (asset.mode & 73))
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
  const keys = new Set;
  for (const lock of release.locks) {
    if (compositionKey(JSON.parse(lock.key)) !== lock.key)
      throw new Error("Noncanonical lock composition");
    if (keys.has(lock.key))
      throw new Error("Duplicate lock composition");
    keys.add(lock.key);
    if (!lock.files.length || !Object.keys(lock.manifests).length)
      throw new Error("Empty lock composition");
    const destinations = new Set;
    for (const [file, digest] of Object.entries(lock.manifests)) {
      safeRelativePath(file);
      if (!digestPattern.test(digest))
        throw new Error("Invalid dependency manifest digest");
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
function compositionKey(choices) {
  if (!Object.keys(choices).length || Object.values(choices).some((value) => value !== null && typeof value !== "string" && typeof value !== "boolean"))
    throw new Error("Invalid dependency composition");
  return JSON.stringify(Object.fromEntries(Object.entries(choices).sort(compareKeys)));
}
function canonical(value) {
  if (Array.isArray(value))
    return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).sort(compareKeys).map(([key, item]) => [key, canonical(item)]));
  return value;
}
function dependencyDigest(manifest) {
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
    "extra"
  ];
  return sha256(JSON.stringify(canonical(Object.fromEntries(fields.filter((key) => Object.hasOwn(manifest, key)).map((key) => [key, manifest[key]])))));
}
function selectReleaseLock(release, choices) {
  const matches = release.locks.filter((lock) => lock.key === compositionKey(choices));
  if (matches.length !== 1)
    throw new Error("No unique tested release lock for this dependency composition");
  return matches[0];
}
async function applyReleaseLock(target, choices, root = packageRoot()) {
  const release = verifyReleaseBundle(root);
  const lock = selectReleaseLock(release, choices);
  for (const [file, digest] of Object.entries(lock.manifests))
    if (dependencyDigest(jsonFile(target, file)) !== digest)
      throw new Error(`Dependency composition mismatch: ${file}`);
  const writes = lock.files.map((file) => ({
    destination: regularPackagePath(target, file.destination, true),
    bytes: verifyBytes(path7.join(root, "template"), file.source, file.sha256)
  }));
  for (const file of writes)
    if (lstatSync2(file.destination, { throwIfNoEntry: false })?.isDirectory())
      throw new Error("Lock destination is a directory");
  for (const file of writes) {
    await mkdir3(path7.dirname(file.destination), { recursive: true });
    await writeFile6(file.destination, file.bytes);
    await chmod2(file.destination, 420);
  }
}
async function applyBundledStandards(options, root = packageRoot()) {
  const release = verifyReleaseBundle(root);
  const exportRoot = path7.join(root, "template/standards");
  const runtime = await import(pathToFileURL(path7.join(exportRoot, "apply.mjs")).href);
  runtime.verifyExport(exportRoot, release.standards.assetDigest);
  const receipt = regularPackagePath(options.target, "F7T_MANIFEST.json", true);
  if (lstatSync2(receipt, { throwIfNoEntry: false })?.isDirectory())
    throw new Error("Generator receipt destination is a directory");
  const brief = regularPackagePath(options.target, "AGENTS.md", true);
  if (lstatSync2(brief, { throwIfNoEntry: false })?.isDirectory())
    throw new Error("Project brief destination is a directory");
  runtime.applyExport({ ...options, exportRoot, expectedDigest: release.standards.assetDigest });
  await writeProjectBrief(options);
  await writeFile6(receipt, `${JSON.stringify({ schemaVersion: 1, generatorVersion: release.generatorVersion, templateRevision: release.templateRevision, standards: release.standards, variant: options.variant }, null, 2)}
`);
}

// cli/src/create-app.ts
class GenerationError extends Error {
  result;
  constructor(result) {
    super(result.message);
    this.result = result;
  }
}
async function assertProjectDirReady(projectDir) {
  let cursor = path8.resolve(projectDir);
  while (true) {
    const info = await lstat3(cursor).catch((error) => {
      if (error.code === "ENOENT")
        return;
      throw error;
    });
    if (info && (!info.isDirectory() || info.isSymbolicLink()))
      throw new Error("Target and its parents must be regular directories");
    const parent = path8.dirname(cursor);
    if (parent === cursor)
      break;
    cursor = parent;
  }
  const entries = await readdir2(projectDir).catch((error) => {
    if (error.code === "ENOENT")
      return [];
    throw error;
  });
  if (entries.length)
    throw new Error("Target directory is not empty. --force no longer overlays files; choose an empty target. Rerun setup to resume an existing project");
}
async function composeNext(config) {
  await runInstallers(config);
  await writeEnv(config);
}
async function createApp(config, options = {}) {
  let stage = "validation";
  const setupRecovery = stacks[config.stack]?.setupEntryPoint ?? "bun run setup";
  try {
    const { stack, appName, projectDir, git, skipInstall, force } = config;
    const normalized = resolveConfig(stack === "next-only" ? config : {
      stack,
      appName,
      git,
      skipInstall,
      force,
      harness: config.harness,
      githubActions: config.githubActions
    }, path8.dirname(projectDir));
    const keys = new Set([...Object.keys(config), ...Object.keys(normalized)]);
    if ([...keys].some((key) => Reflect.get(config, key) !== Reflect.get(normalized, key)))
      throw new Error("Invalid normalized configuration; use resolveConfig before generation");
    await assertProjectDirReady(projectDir);
    stage = "preflight";
    const root = options.bundleRoot ?? packageRoot();
    const release = verifyReleaseBundle(root);
    const definition = stacks[stack];
    if (release.templates[stack].root !== definition.templateRoot)
      throw new Error("Release template root does not match the stack registry");
    const choices = dependencyComposition(config);
    selectReleaseLock(release, choices);
    const source = regularPackagePath(path8.join(root, "template"), definition.templateRoot);
    if (!skipInstall && !options.install && !options.setup) {
      await checkPrerequisites(stack, path8.dirname(projectDir));
    }
    stage = "copy";
    await mkdir4(projectDir, { recursive: true });
    await copyTemplateDir(source, projectDir, {
      __F7T_APP_NAME__: appName,
      __F7T_LOCALE__: config.locale,
      __F7T_HTML_LANG__: config.intl ? "en" : config.locale
    });
    if (config.stack === "next-only")
      await (options.composeNext ?? composeNext)(config);
    await applyBundledStandards({
      target: projectDir,
      variant: stack,
      team: "FunnySoft",
      teamSlug: "funnysoft",
      productBlurb: `${appName} application`
    }, root);
    await applyReleaseLock(projectDir, choices, root);
    await copyTemplateDir(regularPackagePath(path8.join(root, "template"), "shared"), path8.join(projectDir, "scripts"), {});
    if (git)
      await initGit(projectDir);
    if (!skipInstall) {
      stage = "dependencies";
      if (options.install)
        await options.install(config);
      stage = "setup";
      const setup = options.setup ? await options.setup(config) : !options.install ? await initializeProject(projectDir, stack) : undefined;
      if (setup?.status === "incomplete")
        throw new GenerationError(setup);
      if (setup)
        return setup;
    }
    return {
      status: "setup-pending",
      stack,
      failedStage: null,
      pendingSteps: skipInstall ? ["dependencies", "local-setup", "verification"] : ["local-setup", "verification"],
      recovery: setupRecovery,
      message: "Files generated. Setup pending; the project has not been verified as local-ready."
    };
  } catch (error) {
    if (error instanceof GenerationError)
      throw error;
    const beforeCopy = stage === "validation" || stage === "preflight";
    const message = beforeCopy && error instanceof Error ? error.message : stage === "copy" ? "Generation failed while copying or configuring files. Preserve the partial directory and choose a new empty target or clean it up manually." : stage === "dependencies" ? "Dependency installation failed or is unavailable. Check prerequisites and configured package access, then rerun setup." : "Local setup failed. Check prerequisites and rerun setup.";
    throw new GenerationError({
      status: "incomplete",
      stack: config.stack,
      failedStage: stage,
      pendingSteps: beforeCopy || stage === "copy" ? ["generation", "dependencies", "local-setup", "verification"] : stage === "dependencies" ? ["dependencies", "local-setup", "verification"] : ["local-setup", "verification"],
      recovery: beforeCopy || stage === "copy" ? "Use a new empty target after resolving the reported issue" : setupRecovery,
      message
    });
  }
}

// cli/src/next-steps.ts
function formatResult(result) {
  return [
    result.message,
    `Stack: ${result.stack ?? "unresolved"}`,
    `Status: ${result.status}`,
    ...result.failedStage ? [`Failed stage: ${result.failedStage}`] : [],
    `Pending steps: ${result.pendingSteps.join(", ")}`,
    `Recovery: ${result.recovery}`
  ].join(`
`);
}
function logNextSteps(config, result, output = console.log) {
  if (result?.status === "incomplete")
    return;
  const lines = [
    "Next steps (after required setup and verification):",
    "",
    `  cd ${config.appName}`
  ];
  if (config.stack !== "next-only") {
    lines.push("  Follow the generated local setup guide for PHP, Composer, PostgreSQL, Redis and local mail.", "  bun run setup", "  Herd Mail uses the generated project name as its mailbox.");
    if (config.stack === "api-next")
      lines.push("  Next.js: apps/web", "  Laravel: services/api");
    lines.push("  After initialization: bun run dev; run php artisan horizon in the Laravel root.", "  Create the first unverified account separately: php artisan funnysoft:create-first-user.");
    output(lines.join(`
`));
    return;
  }
  if (config.skipInstall) {
    lines.push("  bun run setup", "  Setup is pending until this succeeds.");
  }
  lines.push("  bun run dev", "  bun run check");
  if (config.data === "drizzle" && config.db === "postgres") {
    lines.push("  docker compose up -d && bun run db:migrate");
  } else if (config.data === "drizzle") {
    lines.push("  bun run db:migrate");
  }
  if (config.data === "sanity") {
    lines.push("  Connect Sanity project and dataset manually, then bun run typegen and bun run setup.");
  }
  if (config.playwright) {
    lines.push("  bunx playwright install");
  }
  output(lines.join(`
`));
}

// node_modules/@clack/core/dist/index.mjs
import { styleText } from "node:util";
import { stdout, stdin } from "node:process";
import l__default from "node:readline";

// node_modules/fast-string-truncated-width/dist/utils.js
var getCodePointsLength = (() => {
  const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  return (input) => {
    let surrogatePairsNr = 0;
    SURROGATE_PAIR_RE.lastIndex = 0;
    while (SURROGATE_PAIR_RE.test(input)) {
      surrogatePairsNr += 1;
    }
    return input.length - surrogatePairsNr;
  };
})();
var isFullWidth = (x) => {
  return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
};
var isWideNotCJKTNotEmoji = (x) => {
  return x === 8987 || x === 9001 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
};

// node_modules/fast-string-truncated-width/dist/index.js
var ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c)/y;
var CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var CJKT_WIDE_RE = /(?:(?![\uFF61-\uFF9F\uFF00-\uFFEF])[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Tangut}]){1,1000}/yu;
var TAB_RE = /\t{1,1000}/y;
var EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var MODIFIER_RE = /\p{M}+/gu;
var NO_TRUNCATION = { limit: Infinity, ellipsis: "" };
var getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
  const LIMIT = truncationOptions.limit ?? Infinity;
  const ELLIPSIS = truncationOptions.ellipsis ?? "";
  const ELLIPSIS_WIDTH = truncationOptions?.ellipsisWidth ?? (ELLIPSIS ? getStringTruncatedWidth(ELLIPSIS, NO_TRUNCATION, widthOptions).width : 0);
  const ANSI_WIDTH = 0;
  const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
  const TAB_WIDTH = widthOptions.tabWidth ?? 8;
  const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
  const FULL_WIDTH_WIDTH = 2;
  const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
  const WIDE_WIDTH = widthOptions.wideWidth ?? FULL_WIDTH_WIDTH;
  const PARSE_BLOCKS = [
    [LATIN_RE, REGULAR_WIDTH],
    [ANSI_RE, ANSI_WIDTH],
    [CONTROL_RE, CONTROL_WIDTH],
    [TAB_RE, TAB_WIDTH],
    [EMOJI_RE, EMOJI_WIDTH],
    [CJKT_WIDE_RE, WIDE_WIDTH]
  ];
  let indexPrev = 0;
  let index = 0;
  let length = input.length;
  let lengthExtra = 0;
  let truncationEnabled = false;
  let truncationIndex = length;
  let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH);
  let unmatchedStart = 0;
  let unmatchedEnd = 0;
  let width = 0;
  let widthExtra = 0;
  outer:
    while (true) {
      if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
        const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
        lengthExtra = 0;
        for (const char of unmatched.replaceAll(MODIFIER_RE, "")) {
          const codePoint = char.codePointAt(0) || 0;
          if (isFullWidth(codePoint)) {
            widthExtra = FULL_WIDTH_WIDTH;
          } else if (isWideNotCJKTNotEmoji(codePoint)) {
            widthExtra = WIDE_WIDTH;
          } else {
            widthExtra = REGULAR_WIDTH;
          }
          if (width + widthExtra > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
          }
          if (width + widthExtra > LIMIT) {
            truncationEnabled = true;
            break outer;
          }
          lengthExtra += char.length;
          width += widthExtra;
        }
        unmatchedStart = unmatchedEnd = 0;
      }
      if (index >= length) {
        break outer;
      }
      for (let i = 0, l = PARSE_BLOCKS.length;i < l; i++) {
        const [BLOCK_RE, BLOCK_WIDTH] = PARSE_BLOCKS[i];
        BLOCK_RE.lastIndex = index;
        if (BLOCK_RE.test(input)) {
          lengthExtra = BLOCK_RE === CJKT_WIDE_RE ? getCodePointsLength(input.slice(index, BLOCK_RE.lastIndex)) : BLOCK_RE === EMOJI_RE ? 1 : BLOCK_RE.lastIndex - index;
          widthExtra = lengthExtra * BLOCK_WIDTH;
          if (width + widthExtra > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / BLOCK_WIDTH));
          }
          if (width + widthExtra > LIMIT) {
            truncationEnabled = true;
            break outer;
          }
          width += widthExtra;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = BLOCK_RE.lastIndex;
          continue outer;
        }
      }
      index += 1;
    }
  return {
    width: truncationEnabled ? truncationLimit : width,
    index: truncationEnabled ? truncationIndex : length,
    truncated: truncationEnabled,
    ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH
  };
};
var dist_default = getStringTruncatedWidth;

// node_modules/fast-string-width/dist/index.js
var NO_TRUNCATION2 = {
  limit: Infinity,
  ellipsis: "",
  ellipsisWidth: 0
};
var fastStringWidth = (input, options = {}) => {
  return dist_default(input, NO_TRUNCATION2, options).width;
};
var dist_default2 = fastStringWidth;

// node_modules/fast-wrap-ansi/lib/main.js
var ESC = "\x1B";
var CSI = "";
var END_CODE = 39;
var ANSI_ESCAPE_BELL = "\x07";
var ANSI_CSI = "[";
var ANSI_OSC = "]";
var ANSI_SGR_TERMINATOR = "m";
var ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
var GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
var getClosingCode = (openingCode) => {
  if (openingCode >= 30 && openingCode <= 37)
    return 39;
  if (openingCode >= 90 && openingCode <= 97)
    return 39;
  if (openingCode >= 40 && openingCode <= 47)
    return 49;
  if (openingCode >= 100 && openingCode <= 107)
    return 49;
  if (openingCode === 1 || openingCode === 2)
    return 22;
  if (openingCode === 3)
    return 23;
  if (openingCode === 4)
    return 24;
  if (openingCode === 7)
    return 27;
  if (openingCode === 8)
    return 28;
  if (openingCode === 9)
    return 29;
  if (openingCode === 0)
    return 0;
  return;
};
var wrapAnsiCode = (code) => `${ESC}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
var wrapAnsiHyperlink = (url) => `${ESC}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
var wrapWord = (rows, word, columns) => {
  const characters = word[Symbol.iterator]();
  let isInsideEscape = false;
  let isInsideLinkEscape = false;
  let lastRow = rows.at(-1);
  let visible = lastRow === undefined ? 0 : dist_default2(lastRow);
  let currentCharacter = characters.next();
  let nextCharacter = characters.next();
  let rawCharacterIndex = 0;
  while (!currentCharacter.done) {
    const character = currentCharacter.value;
    const characterLength = dist_default2(character);
    if (visible + characterLength <= columns) {
      rows[rows.length - 1] += character;
    } else {
      rows.push(character);
      visible = 0;
    }
    if (character === ESC || character === CSI) {
      isInsideEscape = true;
      isInsideLinkEscape = word.startsWith(ANSI_ESCAPE_LINK, rawCharacterIndex + 1);
    }
    if (isInsideEscape) {
      if (isInsideLinkEscape) {
        if (character === ANSI_ESCAPE_BELL) {
          isInsideEscape = false;
          isInsideLinkEscape = false;
        }
      } else if (character === ANSI_SGR_TERMINATOR) {
        isInsideEscape = false;
      }
    } else {
      visible += characterLength;
      if (visible === columns && !nextCharacter.done) {
        rows.push("");
        visible = 0;
      }
    }
    currentCharacter = nextCharacter;
    nextCharacter = characters.next();
    rawCharacterIndex += character.length;
  }
  lastRow = rows.at(-1);
  if (!visible && lastRow !== undefined && lastRow.length && rows.length > 1) {
    rows[rows.length - 2] += rows.pop();
  }
};
var stringVisibleTrimSpacesRight = (string) => {
  const words = string.split(" ");
  let last = words.length;
  while (last) {
    if (dist_default2(words[last - 1])) {
      break;
    }
    last--;
  }
  if (last === words.length) {
    return string;
  }
  return words.slice(0, last).join(" ") + words.slice(last).join("");
};
var exec = (string, columns, options = {}) => {
  if (options.trim !== false && string.trim() === "") {
    return "";
  }
  let returnValue = "";
  let escapeCode;
  let escapeUrl;
  const words = string.split(" ");
  let rows = [""];
  let rowLength = 0;
  for (let index = 0;index < words.length; index++) {
    const word = words[index];
    if (options.trim !== false) {
      const row = rows.at(-1) ?? "";
      const trimmed = row.trimStart();
      if (row.length !== trimmed.length) {
        rows[rows.length - 1] = trimmed;
        rowLength = dist_default2(trimmed);
      }
    }
    if (index !== 0) {
      if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
        rows.push("");
        rowLength = 0;
      }
      if (rowLength || options.trim === false) {
        rows[rows.length - 1] += " ";
        rowLength++;
      }
    }
    const wordLength = dist_default2(word);
    if (options.hard && wordLength > columns) {
      const remainingColumns = columns - rowLength;
      const breaksStartingThisLine = 1 + Math.floor((wordLength - remainingColumns - 1) / columns);
      const breaksStartingNextLine = Math.floor((wordLength - 1) / columns);
      if (breaksStartingNextLine < breaksStartingThisLine) {
        rows.push("");
      }
      wrapWord(rows, word, columns);
      rowLength = dist_default2(rows.at(-1) ?? "");
      continue;
    }
    if (rowLength + wordLength > columns && rowLength && wordLength) {
      if (options.wordWrap === false && rowLength < columns) {
        wrapWord(rows, word, columns);
        rowLength = dist_default2(rows.at(-1) ?? "");
        continue;
      }
      rows.push("");
      rowLength = 0;
    }
    if (rowLength + wordLength > columns && options.wordWrap === false) {
      wrapWord(rows, word, columns);
      rowLength = dist_default2(rows.at(-1) ?? "");
      continue;
    }
    rows[rows.length - 1] += word;
    rowLength += wordLength;
  }
  if (options.trim !== false) {
    rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
  }
  const preString = rows.join(`
`);
  let inSurrogate = false;
  for (let i = 0;i < preString.length; i++) {
    const character = preString[i];
    returnValue += character;
    if (!inSurrogate) {
      inSurrogate = character >= "\uD800" && character <= "\uDBFF";
      if (inSurrogate) {
        continue;
      }
    } else {
      inSurrogate = false;
    }
    if (character === ESC || character === CSI) {
      GROUP_REGEX.lastIndex = i + 1;
      const groupsResult = GROUP_REGEX.exec(preString);
      const groups = groupsResult?.groups;
      if (groups?.code !== undefined) {
        const code = Number.parseFloat(groups.code);
        escapeCode = code === END_CODE ? undefined : code;
      } else if (groups?.uri !== undefined) {
        escapeUrl = groups.uri.length === 0 ? undefined : groups.uri;
      }
    }
    if (preString[i + 1] === `
`) {
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink("");
      }
      const closingCode = escapeCode ? getClosingCode(escapeCode) : undefined;
      if (escapeCode && closingCode) {
        returnValue += wrapAnsiCode(closingCode);
      }
    } else if (character === `
`) {
      if (escapeCode && getClosingCode(escapeCode)) {
        returnValue += wrapAnsiCode(escapeCode);
      }
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink(escapeUrl);
      }
    }
  }
  return returnValue;
};
var CRLF_OR_LF = /\r?\n/;
function wrapAnsi(string, columns, options) {
  return String(string).normalize().split(CRLF_OR_LF).map((line) => exec(line, columns, options)).join(`
`);
}

// node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
function findCursor(s, o, l) {
  if (!l.some((r) => !r.disabled))
    return s;
  const t = s + o, n = Math.max(l.length - 1, 0), e = t < 0 ? n : t > n ? 0 : t;
  return l[e]?.disabled ? findCursor(e, o < 0 ? -1 : 1, l) : e;
}
var a$1 = ["up", "down", "left", "right", "space", "enter", "cancel"];
var t = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var settings = {
  actions: new Set(a$1),
  aliases: /* @__PURE__ */ new Map([
    ["k", "up"],
    ["j", "down"],
    ["h", "left"],
    ["l", "right"],
    ["\x03", "cancel"],
    ["escape", "cancel"]
  ]),
  messages: {
    cancel: "Canceled",
    error: "Something went wrong"
  },
  withGuide: true,
  date: {
    monthNames: [...t],
    messages: {
      required: "Please enter a valid date",
      invalidMonth: "There are only 12 months in a year",
      invalidDay: (n, e) => `There are only ${n} days in ${e}`,
      afterMin: (n) => `Date must be on or after ${n.toISOString().slice(0, 10)}`,
      beforeMax: (n) => `Date must be on or before ${n.toISOString().slice(0, 10)}`
    }
  }
};
function isActionKey(n, e) {
  if (typeof n == "string")
    return settings.aliases.get(n) === e;
  for (const s of n)
    if (s !== undefined && isActionKey(s, e))
      return true;
  return false;
}
function diffLines(i, s) {
  if (i === s)
    return;
  const e = i.split(`
`), t2 = s.split(`
`), r = Math.max(e.length, t2.length), f = [];
  for (let n = 0;n < r; n++)
    e[n] !== t2[n] && f.push(n);
  return {
    lines: f,
    numLinesBefore: e.length,
    numLinesAfter: t2.length,
    numLines: r
  };
}
var R = globalThis.process.platform.startsWith("win");
var CANCEL_SYMBOL = Symbol("clack:cancel");
function isCancel(e) {
  return e === CANCEL_SYMBOL;
}
function setRawMode(e, r) {
  const o = e;
  o.isTTY && o.setRawMode(r);
}
var getColumns = (e) => ("columns" in e) && typeof e.columns == "number" ? e.columns : 80;
var getRows = (e) => ("rows" in e) && typeof e.rows == "number" ? e.rows : 20;
function wrapTextWithPrefix(e, r, o, t2 = o, s = o, n) {
  const f = getColumns(e ?? stdout);
  return wrapAnsi(r, f - o.length, {
    hard: true,
    trim: false
  }).split(`
`).map((c, i, m) => {
    const d = n ? n(c, i) : c;
    return i === 0 ? `${t2}${d}` : i === m.length - 1 ? `${s}${d}` : `${o}${d}`;
  }).join(`
`);
}
function runValidation(e, n) {
  if ("~standard" in e) {
    const a = e["~standard"].validate(n);
    if (a instanceof Promise)
      throw new TypeError("Schema validation must be synchronous. Update `validate()` and remove any asynchronous logic.");
    return a.issues?.at(0)?.message;
  }
  return e(n);
}

class V {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = /* @__PURE__ */ new Map;
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  constructor(t2, e = true) {
    const { input: i = stdin, output: n = stdout, render: s, signal: r, ...o } = t2;
    this.opts = o, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = s.bind(this), this._track = e, this._abortSignal = r, this.input = i, this.output = n;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(t2, e) {
    const i = this._subscribers.get(t2) ?? [];
    i.push(e), this._subscribers.set(t2, i);
  }
  on(t2, e) {
    this.setSubscriber(t2, { cb: e });
  }
  once(t2, e) {
    this.setSubscriber(t2, { cb: e, once: true });
  }
  emit(t2, ...e) {
    const i = this._subscribers.get(t2) ?? [], n = [];
    for (const s of i)
      s.cb(...e), s.once && n.push(() => i.splice(i.indexOf(s), 1));
    for (const s of n)
      s();
  }
  prompt() {
    return new Promise((t2) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), t2(CANCEL_SYMBOL);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      this.rl = l__default.createInterface({
        input: this.input,
        tabSize: 2,
        prompt: "",
        escapeCodeTimeout: 50,
        terminal: true
      }), this.rl.prompt(), this.opts.initialUserInput !== undefined && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), setRawMode(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(CANCEL_SYMBOL);
      });
    });
  }
  _isActionKey(t2, e) {
    return t2 === "\t";
  }
  _shouldSubmit(t2, e) {
    return true;
  }
  _setValue(t2) {
    this.value = t2, this.emit("value", this.value);
  }
  _setUserInput(t2, e) {
    this.userInput = t2 ?? "", this.emit("userInput", this.userInput), e && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  onKeypress(t2, e) {
    if (this._track && e.name !== "return" && (e.name && this._isActionKey(t2, e) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), e?.name && (!this._track && settings.aliases.has(e.name) && this.emit("cursor", settings.aliases.get(e.name)), settings.actions.has(e.name) && this.emit("cursor", e.name)), t2 && (t2.toLowerCase() === "y" || t2.toLowerCase() === "n") && this.emit("confirm", t2.toLowerCase() === "y"), this.emit("key", t2, e), e?.name === "return" && this._shouldSubmit(t2, e)) {
      if (this.opts.validate) {
        const i = runValidation(this.opts.validate, this.value);
        i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
      }
      this.state !== "error" && (this.state = "submit");
    }
    isActionKey([t2, e?.name, e?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), setRawMode(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const t2 = wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, t2 * -1));
  }
  render() {
    const t2 = wrapAnsi(this._render(this) ?? "", process.stdout.columns, {
      hard: true,
      trim: false
    });
    if (t2 !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const e = diffLines(this._prevFrame, t2), i = getRows(this.output);
        if (this.restoreCursor(), e) {
          const n = Math.max(0, e.numLinesAfter - i), s = Math.max(0, e.numLinesBefore - i);
          let r = e.lines.find((o) => o >= n);
          if (r === undefined) {
            this._prevFrame = t2;
            return;
          }
          if (e.lines.length === 1) {
            this.output.write(import_sisteransi.cursor.move(0, r - s)), this.output.write(import_sisteransi.erase.lines(1));
            const o = t2.split(`
`);
            this.output.write(o[r]), this._prevFrame = t2, this.output.write(import_sisteransi.cursor.move(0, o.length - r - 1));
            return;
          } else if (e.lines.length > 1) {
            if (n < s)
              r = n;
            else {
              const h = r - s;
              h > 0 && this.output.write(import_sisteransi.cursor.move(0, h));
            }
            this.output.write(import_sisteransi.erase.down());
            const f = t2.split(`
`).slice(r);
            this.output.write(f.join(`
`)), this._prevFrame = t2;
            return;
          }
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(t2), this.state === "initial" && (this.state = "active"), this._prevFrame = t2;
    }
  }
}
class r extends V {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(t2) {
    super(t2, false), this.value = !!t2.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (i) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = i, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}
var n$1 = class n extends V {
  options;
  cursor = 0;
  get _selectedValue() {
    return this.options[this.cursor];
  }
  changeValue() {
    const e = this._selectedValue;
    this.value = e === undefined ? undefined : e.value;
  }
  constructor(e) {
    super(e, false), this.options = e.options;
    const o = this.options.findIndex(({ value: s }) => s === e.initialValue), t2 = o === -1 ? 0 : o;
    this.cursor = this.options[t2]?.disabled ? findCursor(t2, 1, this.options) : t2, this.changeValue(), this.on("cursor", (s) => {
      switch (s) {
        case "left":
        case "up":
          this.cursor = findCursor(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = findCursor(this.cursor, 1, this.options);
          break;
      }
      this.changeValue();
    });
  }
};
class n2 extends V {
  get userInputWithCursor() {
    if (this.state === "submit")
      return this.userInput;
    const t2 = this.userInput;
    if (this.cursor >= t2.length)
      return `${this.userInput}█`;
    const r2 = t2.slice(0, this.cursor), s = t2.slice(this.cursor, this.cursor + 1), e = t2.slice(this.cursor + 1);
    return `${r2}${styleText("inverse", s)}${e}`;
  }
  get cursor() {
    return this._cursor;
  }
  constructor(t2) {
    super({
      ...t2,
      initialUserInput: t2.initialUserInput ?? t2.initialValue
    }), this.on("userInput", (r2) => {
      this._setValue(r2);
    }), this.on("finalize", () => {
      this.value || (this.value = t2.defaultValue), this.value === undefined && (this.value = "");
    });
  }
}

// node_modules/@clack/prompts/dist/index.mjs
import { styleText as styleText2, stripVTControlCharacters } from "node:util";
import process$1 from "node:process";
var import_sisteransi2 = __toESM(require_src(), 1);
function isUnicodeSupported() {
  if (process$1.platform !== "win32") {
    return process$1.env.TERM !== "linux";
  }
  return Boolean(process$1.env.CI) || Boolean(process$1.env.WT_SESSION) || Boolean(process$1.env.TERMINUS_SUBLIME) || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var unicode = isUnicodeSupported();
var unicodeOr = (o, e) => unicode ? o : e;
var S_STEP_ACTIVE = unicodeOr("◆", "*");
var S_STEP_CANCEL = unicodeOr("■", "x");
var S_STEP_ERROR = unicodeOr("▲", "x");
var S_STEP_SUBMIT = unicodeOr("◇", "o");
var S_BAR_START = unicodeOr("┌", "T");
var S_BAR = unicodeOr("│", "|");
var S_BAR_END = unicodeOr("└", "—");
var S_BAR_START_RIGHT = unicodeOr("┐", "T");
var S_BAR_END_RIGHT = unicodeOr("┘", "—");
var S_RADIO_ACTIVE = unicodeOr("●", ">");
var S_RADIO_INACTIVE = unicodeOr("○", " ");
var S_CHECKBOX_ACTIVE = unicodeOr("◻", "[•]");
var S_CHECKBOX_SELECTED = unicodeOr("◼", "[+]");
var S_CHECKBOX_INACTIVE = unicodeOr("◻", "[ ]");
var S_PASSWORD_MASK = unicodeOr("▪", "•");
var S_BAR_H = unicodeOr("─", "-");
var S_CORNER_TOP_RIGHT = unicodeOr("╮", "+");
var S_CONNECT_LEFT = unicodeOr("├", "+");
var S_CORNER_BOTTOM_RIGHT = unicodeOr("╯", "+");
var S_CORNER_BOTTOM_LEFT = unicodeOr("╰", "+");
var S_CORNER_TOP_LEFT = unicodeOr("╭", "+");
var S_INFO = unicodeOr("●", "•");
var S_SUCCESS = unicodeOr("◆", "*");
var S_WARN = unicodeOr("▲", "!");
var S_ERROR = unicodeOr("■", "x");
var symbol = (o) => {
  switch (o) {
    case "initial":
    case "active":
      return styleText2("cyan", S_STEP_ACTIVE);
    case "cancel":
      return styleText2("red", S_STEP_CANCEL);
    case "error":
      return styleText2("yellow", S_STEP_ERROR);
    case "submit":
      return styleText2("green", S_STEP_SUBMIT);
  }
};
var symbolBar = (o) => {
  switch (o) {
    case "initial":
    case "active":
      return styleText2("cyan", S_BAR);
    case "cancel":
      return styleText2("red", S_BAR);
    case "error":
      return styleText2("yellow", S_BAR);
    case "submit":
      return styleText2("green", S_BAR);
  }
};
function formatInstructionFooter(o, e) {
  const r2 = [`${e ? `${styleText2("cyan", S_BAR)}  ` : ""}${o.join(" • ")}`];
  return e && r2.push(styleText2("cyan", S_BAR_END)), r2;
}
var I = (l, e, w, p, b, C = false) => {
  let r2 = e, O = 0;
  if (C)
    for (let i = p - 1;i >= w; i--) {
      const m = l[i];
      if (m && (r2 -= m.length), O++, r2 <= b)
        break;
    }
  else
    for (let i = w;i < p; i++) {
      const m = l[i];
      if (m && (r2 -= m.length), O++, r2 <= b)
        break;
    }
  return { lineCount: r2, removals: O };
};
var limitOptions = ({
  cursor: l,
  options: e,
  style: w,
  output: p = process.stdout,
  maxItems: b = Number.POSITIVE_INFINITY,
  columnPadding: C = 0,
  rowPadding: r2 = 4
}) => {
  const i = getColumns(p) - C, m = getRows(p), M = styleText2("dim", "..."), v = Math.max(m - r2, 0), a2 = Math.max(Math.min(b, v), 5);
  let f = 0;
  l >= a2 - 3 && (f = Math.max(Math.min(l - a2 + 3, e.length - a2), 0));
  let d = a2 < e.length && f > 0, c = a2 < e.length && f + a2 < e.length;
  const W = Math.min(f + a2, e.length), s = [];
  let g = 0;
  d && g++, c && g++;
  const T = f + (d ? 1 : 0), y = W - (c ? 1 : 0);
  for (let t2 = T;t2 < y; t2++) {
    const n3 = e[t2], o = n3 ? w(n3, t2 === l) : "", h2 = wrapAnsi(o, i, {
      hard: true,
      trim: false
    }).split(`
`);
    s.push(h2), g += h2.length;
  }
  if (g > v) {
    let t2 = 0, n3 = 0, o = g;
    const h2 = l - T;
    let u2 = v;
    const L = () => I(s, o, 0, h2, u2), E = () => I(s, o, h2 + 1, s.length, u2, true);
    d ? ({ lineCount: o, removals: t2 } = L(), o > u2 && (c || (u2 -= 1), { lineCount: o, removals: n3 } = E())) : (c || (u2 -= 1), { lineCount: o, removals: n3 } = E(), o > u2 && (u2 -= 1, { lineCount: o, removals: t2 } = L())), t2 > 0 && (d = true, s.splice(0, t2)), n3 > 0 && (c = true, s.splice(s.length - n3, n3));
  }
  const x = [];
  d && x.push(M);
  for (const t2 of s)
    for (const n3 of t2)
      x.push(n3);
  return c && x.push(M), x;
};
var confirm = (i) => {
  const a2 = i.active ?? "Yes", s = i.inactive ?? "No";
  return new r({
    active: a2,
    inactive: s,
    signal: i.signal,
    input: i.input,
    output: i.output,
    initialValue: i.initialValue ?? true,
    render() {
      const e = i.withGuide ?? settings.withGuide, u2 = `${symbol(this.state)}  `, l = e ? `${styleText2("gray", S_BAR)}  ` : "", f = wrapTextWithPrefix(i.output, i.message, l, u2), o = `${e ? `${styleText2("gray", S_BAR)}
` : ""}${f}
`, c = this.value ? a2 : s;
      switch (this.state) {
        case "submit": {
          const r2 = e ? `${styleText2("gray", S_BAR)}  ` : "";
          return `${o}${r2}${styleText2("dim", c)}`;
        }
        case "cancel": {
          const r2 = e ? `${styleText2("gray", S_BAR)}  ` : "";
          return `${o}${r2}${styleText2(["strikethrough", "dim"], c)}${e ? `
${styleText2("gray", S_BAR)}` : ""}`;
        }
        default: {
          const r2 = e ? `${styleText2("cyan", S_BAR)}  ` : "", g = e ? styleText2("cyan", S_BAR_END) : "";
          return `${o}${r2}${this.value ? `${styleText2("green", S_RADIO_ACTIVE)} ${a2}` : `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", a2)}`}${i.vertical ? e ? `
${styleText2("cyan", S_BAR)}  ` : `
` : ` ${styleText2("dim", "/")} `}${this.value ? `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", s)}` : `${styleText2("green", S_RADIO_ACTIVE)} ${s}`}
${g}
`;
        }
      }
    }
  }).prompt();
};
var MULTISELECT_INSTRUCTIONS = [
  `${styleText2("dim", "↑/↓")} to navigate`,
  `${styleText2("dim", "Space:")} select`,
  `${styleText2("dim", "Enter:")} confirm`
];
var cancel = (o = "", t2) => {
  const i = t2?.output ?? process.stdout, e = t2?.withGuide ?? settings.withGuide ? `${styleText2("gray", S_BAR_END)}  ` : "";
  i.write(`${e}${styleText2("red", o)}

`);
};
var intro = (o = "", t2) => {
  const i = t2?.output ?? process.stdout, e = t2?.withGuide ?? settings.withGuide ? `${styleText2("gray", S_BAR_START)}  ` : "";
  i.write(`${e}${o}
`);
};
var u2 = {
  light: unicodeOr("─", "-"),
  heavy: unicodeOr("━", "="),
  block: unicodeOr("█", "#")
};
var SELECT_INSTRUCTIONS = [
  `${styleText2("dim", "↑/↓")} to navigate`,
  `${styleText2("dim", "Enter:")} confirm`
];
var c = (t2, o) => t2.includes(`
`) ? t2.split(`
`).map((d) => o(d)).join(`
`) : o(t2);
var select = (t2) => {
  const o = (n3, m) => {
    if (n3 === undefined)
      return "";
    const s = n3.label ?? String(n3.value);
    switch (m) {
      case "disabled":
        return `${styleText2("gray", S_RADIO_INACTIVE)} ${c(s, (i) => styleText2("gray", i))}${n3.hint ? ` ${styleText2("dim", `(${n3.hint ?? "disabled"})`)}` : ""}`;
      case "selected":
        return `${c(s, (i) => styleText2("dim", i))}`;
      case "active":
        return `${styleText2("green", S_RADIO_ACTIVE)} ${s}${n3.hint ? ` ${styleText2("dim", `(${n3.hint})`)}` : ""}`;
      case "cancelled":
        return `${c(s, (i) => styleText2(["strikethrough", "dim"], i))}`;
      default:
        return `${styleText2("dim", S_RADIO_INACTIVE)} ${c(s, (i) => styleText2("dim", i))}`;
    }
  }, d = t2.showInstructions ?? true;
  return new n$1({
    options: t2.options,
    signal: t2.signal,
    input: t2.input,
    output: t2.output,
    initialValue: t2.initialValue,
    render() {
      const n3 = t2.withGuide ?? settings.withGuide, m = `${symbol(this.state)}  `, s = `${symbolBar(this.state)}  `, i = wrapTextWithPrefix(t2.output, t2.message, s, m), u3 = `${n3 ? `${styleText2("gray", S_BAR)}
` : ""}${i}
`;
      switch (this.state) {
        case "submit": {
          const r2 = n3 ? `${styleText2("gray", S_BAR)}  ` : "", a2 = wrapTextWithPrefix(t2.output, o(this.options[this.cursor], "selected"), r2);
          return `${u3}${a2}`;
        }
        case "cancel": {
          const r2 = n3 ? `${styleText2("gray", S_BAR)}  ` : "", a2 = wrapTextWithPrefix(t2.output, o(this.options[this.cursor], "cancelled"), r2);
          return `${u3}${a2}${n3 ? `
${styleText2("gray", S_BAR)}` : ""}`;
        }
        default: {
          const r2 = n3 ? `${styleText2("cyan", S_BAR)}  ` : "", a2 = u3.split(`
`).length, p = d ? formatInstructionFooter(SELECT_INSTRUCTIONS, n3) : n3 ? [styleText2("cyan", S_BAR_END)] : [], b = p.join(`
`), f = p.length + 1;
          return `${u3}${r2}${limitOptions({
            output: t2.output,
            cursor: this.cursor,
            options: this.options,
            maxItems: t2.maxItems,
            columnPadding: r2.length,
            rowPadding: a2 + f,
            style: (g, x) => o(g, g.disabled ? "disabled" : x ? "active" : "inactive")
          }).join(`
${r2}`)}
${b}
`;
        }
      }
    }
  }).prompt();
};
var i = `${styleText2("gray", S_BAR)}  `;
var text = (e) => new n2({
  validate: e.validate,
  placeholder: e.placeholder,
  defaultValue: e.defaultValue,
  initialValue: e.initialValue,
  output: e.output,
  signal: e.signal,
  input: e.input,
  render() {
    const i2 = e?.withGuide ?? settings.withGuide, s = `${`${i2 ? `${styleText2("gray", S_BAR)}
` : ""}${symbol(this.state)}  `}${e.message}
`, c2 = e.placeholder && e.placeholder.length > 0 ? styleText2("inverse", e.placeholder[0]) + styleText2("dim", e.placeholder.slice(1)) : styleText2(["inverse", "hidden"], "_"), o = this.userInput ? this.userInputWithCursor : c2, l = this.value ?? "";
    switch (this.state) {
      case "error": {
        const n3 = this.error ? `  ${styleText2("yellow", this.error)}` : "", r2 = i2 ? `${styleText2("yellow", S_BAR)}  ` : "", d = i2 ? styleText2("yellow", S_BAR_END) : "";
        return `${s.trim()}
${r2}${o}
${d}${n3}
`;
      }
      case "submit": {
        const n3 = l ? `  ${styleText2("dim", l)}` : "", r2 = i2 ? styleText2("gray", S_BAR) : "";
        return `${s}${r2}${n3}`;
      }
      case "cancel": {
        const n3 = l ? `  ${styleText2(["strikethrough", "dim"], l)}` : "", r2 = i2 ? styleText2("gray", S_BAR) : "";
        return `${s}${r2}${n3}${l.trim() ? `
${r2}` : ""}`;
      }
      default: {
        const n3 = i2 ? `${styleText2("cyan", S_BAR)}  ` : "", r2 = i2 ? styleText2("cyan", S_BAR_END) : "";
        return `${s}${n3}${o}
${r2}
`;
      }
    }
  }
}).prompt();

// cli/src/prompts.ts
function abortIfCancel(value) {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  return value;
}
async function runWizard(input) {
  validateOptions(input);
  intro("create-f7t-app");
  const appName = input.appName ?? abortIfCancel(await text({
    message: "App name",
    placeholder: "my-app",
    validate: (value) => {
      if (!value?.trim()) {
        return "App name is required";
      }
    }
  })).trim();
  const stack = input.stack ?? abortIfCancel(await select({
    message: "Stack",
    options: STACK_IDS.map((value) => ({ value, label: stacks[value].label })),
    initialValue: "next-only"
  }));
  validateOptions({ ...input, stack });
  if (stack !== "next-only") {
    const git2 = input.git ?? abortIfCancel(await confirm({ message: "Git init", initialValue: true }));
    return { ...input, appName, stack, git: git2 };
  }
  const shell = input.shell ?? abortIfCancel(await select({
    message: "Shell",
    options: [
      { value: "site", label: "Site" },
      { value: "app", label: "App" }
    ],
    initialValue: "site"
  }));
  const data = input.data ?? abortIfCancel(await select({
    message: "Data",
    options: [
      { value: "none", label: "None" },
      { value: "sanity", label: "Sanity" },
      { value: "drizzle", label: "Drizzle" }
    ],
    initialValue: "none"
  }));
  let db = input.db;
  if (data === "drizzle" && db === undefined) {
    db = abortIfCancel(await select({
      message: "Database",
      options: [
        { value: "sqlite", label: "SQLite" },
        { value: "postgres", label: "Postgres" }
      ],
      initialValue: "sqlite"
    }));
  }
  const shadcn = input.shadcn ?? abortIfCancel(await confirm({ message: "ShadCN", initialValue: false }));
  const playwright = input.playwright ?? abortIfCancel(await confirm({ message: "Playwright", initialValue: false }));
  const resend = input.resend ?? abortIfCancel(await confirm({ message: "Resend contact form", initialValue: false }));
  const intl = input.intl ?? abortIfCancel(await confirm({ message: "next-intl", initialValue: false }));
  let locale = input.locale;
  if (!intl && locale === undefined) {
    locale = abortIfCancel(await select({
      message: "Locale",
      options: [
        { value: "en", label: "en" },
        { value: "pt-PT", label: "pt-PT" }
      ],
      initialValue: "pt-PT"
    }));
  }
  if (intl) {
    locale = "en";
  }
  const git = input.git ?? abortIfCancel(await confirm({ message: "Git init", initialValue: true }));
  return {
    ...input,
    stack,
    appName,
    shell,
    data,
    db,
    shadcn,
    playwright,
    resend,
    intl,
    locale,
    harness: "opencode",
    githubActions: true,
    git
  };
}

// cli/src/index.ts
var HELP = `Usage: create-f7t-app <app-name> [options]
  --stack next-only|inertia-monolith|api-next  (default: next-only)
  --yes, --CI       Use deterministic defaults; requires an app name
  --json           Emit one nonsecret JSON result; never prompt
  --skip-install   Generate files with setup pending
  --no-git         Skip git initialization
  --help           Show this help
Next-only: --shell site|app --data none|sanity|drizzle --db sqlite|postgres
           --shadcn --playwright --resend --intl --locale en|pt-PT
Laravel: English account app, PostgreSQL, shadcn and Resend are fixed.
OpenCode and quality workflows are mandatory. Remove old --harness
none|grok|cursor|both and --no-github-actions flags (use --harness opencode).
Nonempty targets are always rejected, including with legacy --force.
Resume an existing project's setup instead of regenerating over its files.`;
async function runCli(argv, options = {}) {
  const output = options.output ?? console.log;
  const json = argv.includes("--json");
  let stack = null;
  try {
    const input = parseArgv(argv);
    if (input.help) {
      output(json ? JSON.stringify({ help: HELP }) : HELP);
      return 0;
    }
    const unattended = input.yes || input.ci || input.json || !(options.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY));
    const config = resolveConfig(unattended ? input : await (options.wizard ?? runWizard)(input), options.cwd);
    stack = config.stack;
    const result = await (options.generate ?? createApp)(config);
    output(json ? JSON.stringify(result) : formatResult(result));
    if (!json && result.status !== "incomplete")
      logNextSteps(config, result, output);
    return result.status === "incomplete" ? 1 : 0;
  } catch (error) {
    const result = error instanceof GenerationError ? error.result : {
      status: "incomplete",
      stack,
      failedStage: "validation",
      pendingSteps: ["generation"],
      recovery: "Run --help, correct the options and use an empty target",
      message: stack === null && error instanceof Error ? error.message : "Generation failed. Check prerequisites and rerun setup."
    };
    output(json ? JSON.stringify(result) : formatResult(result));
    return 1;
  }
}
if (process.argv[1] && realpathSync(path9.resolve(process.argv[1])) === fileURLToPath2(import.meta.url)) {
  process.exitCode = await runCli(process.argv.slice(2));
}
export {
  HELP,
  runCli
};
