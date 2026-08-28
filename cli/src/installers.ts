import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CreateConfig } from "./config";
import { appendEnvExample, copyExtra, mergePackageJson } from "./fs";
import { templateDir } from "./paths";

async function runShell(name: string, config: CreateConfig): Promise<void> {
  await copyExtra(name, config, { appPrefix: true });
}

async function runExtra(name: string, config: CreateConfig): Promise<void> {
  await copyExtra(name, config);
  const manifest = readExtraManifest(name);
  if (manifest.package) {
    await mergePackageJson(config.projectDir, manifest.package);
  }
  if (manifest.env) {
    await appendEnvExample(config.projectDir, manifest.env);
  }
}

export type ExtraManifest = {
  package?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  env?: Array<{
    key: string;
    side: "server" | "client";
    zod: string;
    example: string;
  }>;
  agents?: string;
};

export type Installer = {
  name: string;
  shouldRun(config: CreateConfig): boolean;
  run(config: CreateConfig): Promise<void>;
};

export function readExtraManifest(extraName: string): ExtraManifest {
  const manifestPath = path.join(templateDir("extras", extraName), "extra.json");
  if (!existsSync(manifestPath)) {
    return {};
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as ExtraManifest;
}

async function noop(): Promise<void> {}

export const installers: Installer[] = [
  {
    name: "sanity",
    shouldRun: (config) => config.data === "sanity",
    run: (config) => runExtra("sanity", config),
  },
  {
    name: "drizzle-sqlite",
    shouldRun: (config) => config.data === "drizzle" && config.db === "sqlite",
    run: (config) => runExtra("drizzle-sqlite", config),
  },
  {
    name: "drizzle-postgres",
    shouldRun: (config) => config.data === "drizzle" && config.db === "postgres",
    run: (config) => runExtra("drizzle-postgres", config),
  },
  {
    name: "next-intl",
    shouldRun: (config) => config.intl,
    run: noop,
  },
  {
    name: "shell-site",
    shouldRun: (config) => config.shell === "site",
    run: (config) => runShell("shell-site", config),
  },
  {
    name: "shell-app",
    shouldRun: (config) => config.shell === "app",
    run: (config) => runShell("shell-app", config),
  },
  {
    name: "shadcn",
    shouldRun: (config) => config.shadcn,
    run: noop,
  },
  {
    name: "resend",
    shouldRun: (config) => config.resend,
    run: noop,
  },
  {
    name: "playwright",
    shouldRun: (config) => config.playwright,
    run: noop,
  },
  {
    name: "harness-grok",
    shouldRun: (config) => config.harness === "grok" || config.harness === "both",
    run: noop,
  },
  {
    name: "harness-cursor",
    shouldRun: (config) => config.harness === "cursor" || config.harness === "both",
    run: noop,
  },
  {
    name: "github-actions",
    shouldRun: (config) => config.githubActions,
    run: noop,
  },
];

export async function runInstallers(config: CreateConfig): Promise<void> {
  for (const installer of installers) {
    if (installer.shouldRun(config)) {
      await installer.run(config);
    }
  }
}
