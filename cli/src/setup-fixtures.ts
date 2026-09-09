/** Source-only local integration fixture. Never used by the published generator. */
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { copyTemplateDir } from "./fs";
import { stacks, type StackId } from "./stacks";
import { resolveConfig, type FlagInput } from "./config";
import { runInstallers } from "./installers";
import { writeEnv } from "./env-file";

export async function setupFixture(stack: StackId, flags: FlagInput = {}): Promise<string> {
  const temp = await mkdtemp(path.join(tmpdir(), "opencode/u12-"));
  const staging = path.join(temp, "source");
  const source = `template/${stacks[stack].templateRoot}`;
  // Git supplies source inventory only. Ignored live vendors and local env files never cross.
  const files = execFileSync("git", ["ls-files", "-c", "-o", "--exclude-standard", "--", source], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  for (const file of files) {
    const target = path.join(staging, path.relative(source, file));
    await mkdir(path.dirname(target), { recursive: true });
    await cp(file, target);
  }
  const target = path.join(temp, stack === "api-next" ? "u12-api" : "u12-inertia");
  await copyTemplateDir(staging, target, { __F7T_APP_NAME__: path.basename(target) });
  await copyTemplateDir(path.resolve("template/shared"), path.join(target, "scripts"), {});
  if (stack === "next-only") {
    const config = resolveConfig(
      { ...flags, appName: path.basename(target), stack, git: false },
      temp,
    );
    await runInstallers(config);
    await writeEnv(config);
  }
  const archiveRoot = path.join(temp, "standards");
  await mkdir(archiveRoot);
  const commit = "8f3d7d67841c2ba094813c75697446068e6c3767";
  const archive = execFileSync("git", ["-C", "../standards", "archive", commit], {
    maxBuffer: 8 * 1024 * 1024,
  });
  execFileSync("tar", ["-xf", "-", "-C", archiveRoot], { input: archive });
  const exported = path.join(temp, "export");
  execFileSync("node", [
    path.join(archiveRoot, "scripts/standards-export.mjs"),
    "export",
    "--target",
    exported,
    "--release",
    "v0.0.0-u15-fixture",
    "--commit",
    commit,
  ]);
  const manifest = JSON.parse(await readFile(path.join(exported, "manifest.json"), "utf8"));
  const { applyExport } = await import(path.join(exported, "apply.mjs"));
  await applyExport({
    exportRoot: exported,
    expectedDigest: manifest.assetDigest,
    target,
    variant: stack,
    team: "FunnySoft",
    teamSlug: "funnysoft",
    productBlurb: "U12 disposable integration fixture",
  });
  await rm(archiveRoot, { recursive: true });
  await writeFile(
    path.join(temp, "fixture.json"),
    JSON.stringify({ target, stack, standardsCommit: commit }),
  );
  return target;
}
