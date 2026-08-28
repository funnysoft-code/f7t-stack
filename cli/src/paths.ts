import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CreateConfig } from "./config";

export function packageRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(path.join(dir, "template", "base", "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("Could not find package root (template/base/package.json)");
    }
    dir = parent;
  }
}

export function templateDir(...parts: string[]): string {
  return path.join(packageRoot(), "template", ...parts);
}

export function htmlLang(config: CreateConfig): string {
  return config.intl ? "en" : config.locale;
}
