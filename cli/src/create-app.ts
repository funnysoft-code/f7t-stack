import { lstat, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { resolveConfig, type CreateConfig, type NextConfig } from "./config";
import { writeEnv } from "./env-file";
import { copyTemplateDir } from "./fs";
import { initGit } from "./git";
import { installDeps } from "./install";
import { runInstallers } from "./installers";
import { packageRoot, regularPackagePath } from "./paths";
import {
  applyBundledStandards,
  applyReleaseLock,
  selectReleaseLock,
  verifyReleaseBundle,
} from "./standards";
import { dependencyComposition, stacks, type StackId } from "./stacks";

export type GenerationStage = "validation" | "preflight" | "copy" | "dependencies" | "setup";
export type GenerationResult = {
  status: "setup-pending" | "incomplete";
  stack: StackId | null;
  failedStage: GenerationStage | null;
  pendingSteps: string[];
  recovery: string;
  message: string;
};
export class GenerationError extends Error {
  constructor(public readonly result: GenerationResult) {
    super(result.message);
  }
}

/** U12 owns initialization. A successful dependency install alone cannot mean local-ready. */
export type SetupRunner = (config: CreateConfig) => Promise<void>;
export type CreateAppOptions = {
  bundleRoot?: string;
  composeNext?: (config: NextConfig) => Promise<void>;
  install?: SetupRunner;
  setup?: SetupRunner;
};

async function assertProjectDirReady(projectDir: string): Promise<void> {
  // Reject symlinks in the target or its ancestors before following them.
  let cursor = path.resolve(projectDir);
  while (true) {
    const info = await lstat(cursor).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (info && (!info.isDirectory() || info.isSymbolicLink()))
      throw new Error("Target and its parents must be regular directories");
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  const entries = await readdir(projectDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  if (entries.length)
    throw new Error(
      "Target directory is not empty. --force no longer overlays files; choose an empty target. Rerun setup to resume an existing project",
    );
}

async function composeNext(config: NextConfig): Promise<void> {
  await runInstallers(config);
  await writeEnv(config);
}

export async function createApp(
  config: CreateConfig,
  options: CreateAppOptions = {},
): Promise<GenerationResult> {
  let stage: GenerationStage = "validation";
  const setupRecovery = options.setup
    ? (stacks[config.stack]?.setupEntryPoint ?? "Rerun setup")
    : "Local setup runner is pending U12. Preserve these files and complete setup when the runner is available";
  try {
    // Revalidate programmatic callers without treating fixed Laravel defaults as flags.
    const { stack, appName, projectDir, git, skipInstall, force } = config;
    const normalized = resolveConfig(
      stack === "next-only"
        ? config
        : {
            stack,
            appName,
            git,
            skipInstall,
            force,
            harness: config.harness,
            githubActions: config.githubActions,
          },
      path.dirname(projectDir),
    );
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
    const source = regularPackagePath(path.join(root, "template"), definition.templateRoot);
    if (!skipInstall && stack !== "next-only" && !options.install)
      throw new Error(
        "Laravel dependency setup is pending U12; use --skip-install for files-only generation",
      );

    stage = "copy";
    await mkdir(projectDir, { recursive: true });
    await copyTemplateDir(source, projectDir, {
      __F7T_APP_NAME__: appName,
      __F7T_LOCALE__: config.locale,
      __F7T_HTML_LANG__: config.intl ? "en" : config.locale,
    });
    if (config.stack === "next-only") await (options.composeNext ?? composeNext)(config);
    await applyBundledStandards(
      {
        target: projectDir,
        variant: stack,
        team: "FunnySoft",
        teamSlug: "funnysoft",
        productBlurb: `${appName} application`,
      },
      root,
    );
    await applyReleaseLock(projectDir, choices, root);
    if (git) await initGit(projectDir);

    if (!skipInstall) {
      stage = "dependencies";
      if (options.install) await options.install(config);
      else if (stack === "next-only") await installDeps(projectDir);
      else
        throw new Error(
          "Laravel dependency setup is pending U12; use --skip-install for files-only generation",
        );
      stage = "setup";
      if (options.setup) await options.setup(config);
    }
    return {
      status: "setup-pending",
      stack,
      failedStage: null,
      pendingSteps: skipInstall
        ? ["dependencies", "local-setup", "verification"]
        : ["local-setup", "verification"],
      recovery: setupRecovery,
      message: "Files generated. Setup pending; the project has not been verified as local-ready.",
    };
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    const beforeCopy = stage === "validation" || stage === "preflight";
    const message =
      beforeCopy && error instanceof Error
        ? error.message
        : stage === "copy"
          ? "Generation failed while copying or configuring files. Preserve the partial directory and choose a new empty target or clean it up manually."
          : stage === "dependencies"
            ? "Dependency installation failed or is unavailable. Check prerequisites and configured package access, then rerun setup."
            : "Local setup failed. Check prerequisites and rerun setup.";
    throw new GenerationError({
      status: "incomplete",
      stack: config.stack,
      failedStage: stage,
      pendingSteps:
        beforeCopy || stage === "copy"
          ? ["generation", "dependencies", "local-setup", "verification"]
          : stage === "dependencies"
            ? ["dependencies", "local-setup", "verification"]
            : ["local-setup", "verification"],
      recovery:
        beforeCopy || stage === "copy"
          ? "Use a new empty target after resolving the reported issue"
          : setupRecovery,
      message,
    });
  }
}
