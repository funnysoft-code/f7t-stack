import path from "node:path";
import { STACK_IDS, stacks, type StackId } from "./stacks";

export type Shell = "site" | "app";
export type Data = "none" | "sanity" | "drizzle";
export type Db = "sqlite" | "postgres";
export type Harness = "opencode";
export type Locale = "en" | "pt-PT";

type CommonConfig = {
  appName: string;
  projectDir: string;
  harness: Harness;
  githubActions: true;
  git: boolean;
  skipInstall: boolean;
  force: boolean;
};

export type NextConfig = CommonConfig & {
  stack: "next-only";
  shell: Shell;
  data: Data;
  db: Db;
  shadcn: boolean;
  playwright: boolean;
  resend: boolean;
  intl: boolean;
  locale: Locale;
};

export type LaravelConfig = CommonConfig & {
  stack: "inertia-monolith" | "api-next";
  shell: "app";
  locale: "en";
  db: "postgres";
  data?: never;
  intl: false;
  shadcn: true;
  playwright: true;
  resend: true;
};
export type CreateConfig = NextConfig | LaravelConfig;

export type FlagInput = {
  stack?: StackId;
  appName?: string;
  shell?: Shell;
  data?: Data;
  db?: Db;
  shadcn?: boolean;
  playwright?: boolean;
  resend?: boolean;
  intl?: boolean;
  locale?: Locale;
  harness?: Harness | "none" | "grok" | "cursor" | "both";
  githubActions?: boolean;
  git?: boolean;
  skipInstall?: boolean;
  force?: boolean;
  yes?: boolean;
  ci?: boolean;
  json?: boolean;
  help?: boolean;
};

export const YES_DEFAULTS: Omit<NextConfig, "appName" | "projectDir"> = {
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
  force: false,
};

const SHELLS = ["site", "app"] as const satisfies readonly Shell[];
const DATAS = ["none", "sanity", "drizzle"] as const satisfies readonly Data[];
const DBS = ["sqlite", "postgres"] as const satisfies readonly Db[];
const LOCALES = ["en", "pt-PT"] as const satisfies readonly Locale[];

function takeValue(flag: string, argv: string[], index: number): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function takeEnum<T extends string>(flag: string, value: string, allowed: readonly T[]): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${flag} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function parseArgv(argv: string[]): FlagInput {
  const input: FlagInput = {};
  let positionalName: string | undefined;
  const seen = new Set<string>();

  for (let i = 0; i < argv.length; i++) {
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
          throw new Error(
            "OpenCode is mandatory; remove the old --harness flag or use --harness opencode",
          );
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
        throw new Error(
          "OpenCode, applicable shadcn and quality workflows are mandatory; remove policy-off flags",
        );
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

  if (
    input.appName !== undefined &&
    positionalName !== undefined &&
    input.appName !== positionalName
  ) {
    throw new Error("Conflicting app names; use a positional name or --app-name");
  }
  if (input.appName === undefined && positionalName !== undefined) {
    input.appName = positionalName;
  }

  return input;
}

export function resolveConfig(input: FlagInput, cwd: string = process.cwd()): CreateConfig {
  validateOptions(input);
  if ((input.yes || input.ci) && input.appName === undefined) {
    throw new Error("--app-name is required with --yes or --CI");
  }
  if (input.appName === undefined) {
    throw new Error("--app-name is required");
  }

  if (!/^[a-z0-9][a-z0-9_-]*$/.test(input.appName)) {
    throw new Error(
      "App name must use lowercase letters, numbers, hyphens or underscores, and start with a letter or number",
    );
  }

  const common: CommonConfig = {
    appName: input.appName,
    projectDir: path.resolve(cwd, input.appName),
    harness: "opencode",
    githubActions: true,
    git: input.git ?? true,
    skipInstall: input.skipInstall ?? false,
    force: input.force ?? false,
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
      resend: true,
    };
  }
  const config: NextConfig = {
    ...YES_DEFAULTS,
    ...common,
  };

  if (input.shell !== undefined) config.shell = input.shell;
  if (input.data !== undefined) config.data = input.data;
  if (input.db !== undefined) config.db = input.db;
  if (input.shadcn !== undefined) config.shadcn = input.shadcn;
  if (input.playwright !== undefined) config.playwright = input.playwright;
  if (input.resend !== undefined) config.resend = input.resend;
  if (input.intl !== undefined) config.intl = input.intl;
  if (input.locale !== undefined) config.locale = input.locale;

  if (config.intl) {
    config.locale = "en";
  }
  if (config.data !== "drizzle") {
    config.db = "sqlite";
  }

  return config;
}

/** Shared by the wizard and unattended callers, before any prompt or target write. */
export function validateOptions(input: FlagInput): void {
  const stack = input.stack ?? "next-only";
  takeEnum("--stack", stack, STACK_IDS);
  if (input.harness !== undefined && input.harness !== "opencode")
    throw new Error(
      "OpenCode is mandatory; remove the old --harness flag or use --harness opencode",
    );
  if (input.githubActions === false)
    throw new Error("Quality workflows are mandatory; remove --no-github-actions");
  for (const option of stacks[stack].rejectedOptions) {
    if (input[option] !== undefined)
      throw new Error(
        `--${option} is Next-only; Laravel uses a fixed English account app with PostgreSQL and prewired Resend`,
      );
  }
  if (stack !== "next-only" && (input.shadcn === false || input.playwright === false))
    throw new Error("Laravel shadcn and browser quality checks are mandatory");
  if (input.shell !== undefined) takeEnum("--shell", input.shell, SHELLS);
  if (input.data !== undefined) takeEnum("--data", input.data, DATAS);
  if (input.db !== undefined) takeEnum("--db", input.db, DBS);
  if (input.locale !== undefined) takeEnum("--locale", input.locale, LOCALES);
}
