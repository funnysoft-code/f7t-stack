import path from "node:path";

export type Shell = "site" | "app";
export type Data = "none" | "sanity" | "drizzle";
export type Db = "sqlite" | "postgres";
export type Harness = "none" | "grok" | "cursor" | "both";
export type Locale = "en" | "pt-PT";

export type CreateConfig = {
  appName: string;
  projectDir: string;
  shell: Shell;
  data: Data;
  db: Db;
  shadcn: boolean;
  playwright: boolean;
  resend: boolean;
  intl: boolean;
  locale: Locale;
  harness: Harness;
  githubActions: boolean;
  git: boolean;
  skipInstall: boolean;
  force: boolean;
};

export type FlagInput = {
  appName?: string;
  shell?: Shell;
  data?: Data;
  db?: Db;
  shadcn?: boolean;
  playwright?: boolean;
  resend?: boolean;
  intl?: boolean;
  locale?: Locale;
  harness?: Harness;
  githubActions?: boolean;
  git?: boolean;
  skipInstall?: boolean;
  force?: boolean;
  yes?: boolean;
  ci?: boolean;
};

export const YES_DEFAULTS: Omit<CreateConfig, "appName" | "projectDir"> = {
  shell: "site",
  data: "none",
  db: "sqlite",
  shadcn: false,
  playwright: false,
  resend: false,
  intl: false,
  locale: "pt-PT",
  harness: "none",
  githubActions: true,
  git: true,
  skipInstall: false,
  force: false,
};

const SHELLS = ["site", "app"] as const satisfies readonly Shell[];
const DATAS = ["none", "sanity", "drizzle"] as const satisfies readonly Data[];
const DBS = ["sqlite", "postgres"] as const satisfies readonly Db[];
const HARNESSES = ["none", "grok", "cursor", "both"] as const satisfies readonly Harness[];
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

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }

    switch (arg) {
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
        input.harness = takeEnum(arg, takeValue(arg, argv, i), HARNESSES);
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
        input.githubActions = false;
        break;
      default: {
        if (arg.startsWith("-")) {
          throw new Error(`Unknown flag: ${arg}`);
        }
        if (positionalName === undefined) {
          positionalName = arg;
        }
      }
    }
  }

  if (input.appName === undefined && positionalName !== undefined) {
    input.appName = positionalName;
  }

  return input;
}

export function resolveConfig(input: FlagInput, cwd: string = process.cwd()): CreateConfig {
  if ((input.yes || input.ci) && input.appName === undefined) {
    throw new Error("--app-name is required with --yes or --CI");
  }
  if (input.appName === undefined) {
    throw new Error("--app-name is required");
  }

  const config: CreateConfig = {
    ...YES_DEFAULTS,
    appName: input.appName,
    projectDir: path.join(cwd, input.appName),
  };

  if (input.shell !== undefined) config.shell = input.shell;
  if (input.data !== undefined) config.data = input.data;
  if (input.db !== undefined) config.db = input.db;
  if (input.shadcn !== undefined) config.shadcn = input.shadcn;
  if (input.playwright !== undefined) config.playwright = input.playwright;
  if (input.resend !== undefined) config.resend = input.resend;
  if (input.intl !== undefined) config.intl = input.intl;
  if (input.locale !== undefined) config.locale = input.locale;
  if (input.harness !== undefined) config.harness = input.harness;
  if (input.githubActions !== undefined) {
    config.githubActions = input.githubActions;
  }
  if (input.git !== undefined) config.git = input.git;
  if (input.skipInstall !== undefined) config.skipInstall = input.skipInstall;
  if (input.force !== undefined) config.force = input.force;

  if (config.intl) {
    config.locale = "en";
  }
  if (config.data !== "drizzle") {
    config.db = "sqlite";
  }

  return config;
}
