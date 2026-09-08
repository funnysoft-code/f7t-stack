import { existsSync, lstatSync } from "node:fs";
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
  const relative = parts.join("/");
  if (relative) safeRelativePath(relative);
  return path.join(packageRoot(), "template", ...parts);
}

export function safeRelativePath(value: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.includes("\0") ||
    /^[A-Za-z]:/.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid package-relative path");
  }
  return value;
}

/** Check the supplied root and all descendants, including dangling symlinks. */
export function regularPackagePath(root: string, relative: string, allowMissing = false): string {
  safeRelativePath(relative);
  let cursor = path.resolve(root);
  const parts = ["", ...relative.split("/")];
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part);
    const info = lstatSync(cursor, { throwIfNoEntry: false });
    if (!info) {
      if (allowMissing) continue;
      throw new Error(`Missing package asset: ${relative}`);
    }
    if (info.isSymbolicLink()) throw new Error(`Symlink package path: ${relative}`);
    if (index < parts.length - 1 && !info.isDirectory())
      throw new Error(`Invalid package directory: ${relative}`);
    if (index === parts.length - 1 && !info.isFile() && !info.isDirectory())
      throw new Error(`Invalid package file: ${relative}`);
  }
  return cursor;
}

export function htmlLang(config: CreateConfig): string {
  return config.intl ? "en" : config.locale;
}
