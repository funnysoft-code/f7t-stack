#!/usr/bin/env node
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgv, resolveConfig, type CreateConfig, type FlagInput } from "./config";
import { createApp, GenerationError, type GenerationResult } from "./create-app";
import { formatResult, logNextSteps } from "./next-steps";
import { runWizard } from "./prompts";

export const HELP = `Usage: create-f7t-app <app-name> [options]
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

type CliOptions = {
  cwd?: string;
  isTTY?: boolean;
  wizard?: (input: FlagInput) => Promise<FlagInput>;
  generate?: (config: CreateConfig) => Promise<GenerationResult>;
  output?: (text: string) => void;
};

/** Return an exit status so unattended behavior can be tested without exiting the runner. */
export async function runCli(argv: string[], options: CliOptions = {}): Promise<number> {
  const output = options.output ?? console.log;
  const json = argv.includes("--json");
  let stack: CreateConfig["stack"] | null = null;
  try {
    const input = parseArgv(argv);
    if (input.help) {
      output(json ? JSON.stringify({ help: HELP }) : HELP);
      return 0;
    }
    const unattended =
      input.yes ||
      input.ci ||
      input.json ||
      !(options.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY));
    const config = resolveConfig(
      unattended ? input : await (options.wizard ?? runWizard)(input),
      options.cwd,
    );
    stack = config.stack;
    const result = await (options.generate ?? createApp)(config);
    output(json ? JSON.stringify(result) : formatResult(result));
    if (!json && result.status !== "incomplete") logNextSteps(config, result, output);
    return result.status === "incomplete" ? 1 : 0;
  } catch (error) {
    const result: GenerationResult =
      error instanceof GenerationError
        ? error.result
        : {
            status: "incomplete",
            stack,
            failedStage: "validation",
            pendingSteps: ["generation"],
            recovery: "Run --help, correct the options and use an empty target",
            message:
              stack === null && error instanceof Error
                ? error.message
                : "Generation failed. Check prerequisites and rerun setup.",
          };
    output(json ? JSON.stringify(result) : formatResult(result));
    return 1;
  }
}

if (
  process.argv[1] &&
  realpathSync(path.resolve(process.argv[1])) === fileURLToPath(import.meta.url)
) {
  process.exitCode = await runCli(process.argv.slice(2));
}
