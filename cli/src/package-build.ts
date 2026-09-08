import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { assertDistributablePath } from "./fs";
import { packageRoot } from "./paths";
import { packageInventory, verifyReleaseBundle } from "./standards";

/** Compare npm's actual inventory with disk, so nested ignores cannot drop assets silently. */
export function auditPackage(root = packageRoot()): string[] {
  const source = packageInventory(path.join(root, "template")).map((file) => `template/${file}`);
  const result = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ) as Array<{ files: Array<{ path: string }> }>;
  const files = result[0]?.files.map((file) => file.path) ?? [];
  const allowed = new Set(["create-f7t-app.js", "package.json", "README.md", "LICENSE"]);
  for (const file of files) {
    assertDistributablePath(file);
    if (!file.startsWith("template/") && !allowed.has(file))
      throw new Error(`Unexpected package file: ${file}`);
  }
  for (const file of [...source, ...allowed])
    if (!files.includes(file)) throw new Error(`Missing packaged asset: ${file}`);
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  if (pkg.bin !== "./create-f7t-app.js") throw new Error("Unexpected package executable");
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const files = auditPackage();
    if (process.argv.includes("--release")) verifyReleaseBundle();
    console.log(
      `Verified ${files.length} package files${process.argv.includes("--release") ? " and release bundle" : ""}.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Package verification failed");
    process.exitCode = 1;
  }
}
