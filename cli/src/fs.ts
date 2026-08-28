import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function replaceInTree(
  dir: string,
  replacements: Record<string, string>,
): Promise<void> {
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
    let next = content;
    for (const [token, value] of Object.entries(replacements)) {
      next = next.split(token).join(value);
    }
    if (next !== content) {
      await writeFile(abs, next, "utf8");
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
