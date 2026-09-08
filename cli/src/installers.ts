import { existsSync, readFileSync } from "node:fs";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { appPagesRoot } from "./app-root";
import type { CreateConfig } from "./config";
import { appendEnvExample, appendGlobalsCss, copyExtra, mergePackageJson } from "./fs";
import { templateDir } from "./paths";

async function runShell(name: string, config: CreateConfig): Promise<void> {
  await copyExtra(name, config, { appPrefix: true });
}

async function runExtra(
  name: string,
  config: CreateConfig,
  options: { appPrefix?: boolean } = {},
): Promise<void> {
  await copyExtra(name, config, options);
  const manifest = readExtraManifest(name);
  if (manifest.package) {
    await mergePackageJson(config.projectDir, manifest.package);
  }
  if (manifest.env) {
    await appendEnvExample(config.projectDir, manifest.env);
  }
  if (manifest.globalsCss) {
    const snippetPath = path.join(templateDir("extras", name), manifest.globalsCss);
    await appendGlobalsCss(config.projectDir, readFileSync(snippetPath, "utf8"));
  }
}

export function contactPath(config: CreateConfig): string {
  return !config.intl && config.locale === "pt-PT" ? "contacto" : "contact";
}

async function runResend(config: CreateConfig): Promise<void> {
  await runExtra("resend", config, { appPrefix: true });
  const dest = contactPath(config);
  const root = path.join(config.projectDir, appPagesRoot(config));
  if (dest !== "contact") {
    await rename(path.join(root, "contact"), path.join(root, dest));
  }
  if (!config.intl) {
    return;
  }
  const from = path.join(templateDir("extras", "resend"), "intl-contact-page.tsx");
  const content = await readFile(from, "utf8");
  await writeFile(
    path.join(root, dest, "page.tsx"),
    content.split("__F7T_APP_NAME__").join(config.appName),
  );
}

async function runNextIntl(config: CreateConfig): Promise<void> {
  await runExtra("next-intl", config);
  await unlink(path.join(config.projectDir, "src/app/page.tsx"));
  const studioDir = path.join(config.projectDir, "src/app/studio");
  if (!existsSync(studioDir)) {
    return;
  }
  await writeFile(
    path.join(studioDir, "layout.tsx"),
    `export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  );
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
  globalsCss?: string;
  skip?: string[];
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

const GITHUB_E2E_JOB = `
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e
`;

async function runGithubActions(config: CreateConfig): Promise<void> {
  await copyExtra("github-actions", config);
  const ymlPath = path.join(config.projectDir, ".github/workflows/ci.yml");
  const yml = await readFile(ymlPath, "utf8");
  const next = yml.split("__F7T_E2E_JOB__").join(config.playwright ? GITHUB_E2E_JOB : "");
  await writeFile(ymlPath, next.replace(/\n+$/, "\n"));
}

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
    run: (config) => runNextIntl(config),
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
    run: (config) => runExtra("shadcn", config),
  },
  {
    name: "resend",
    shouldRun: (config) => config.resend,
    run: (config) => runResend(config),
  },
  {
    name: "playwright",
    shouldRun: (config) => config.playwright,
    run: (config) => runExtra("playwright", config),
  },
  {
    name: "github-actions",
    shouldRun: (config) => config.githubActions,
    run: (config) => runGithubActions(config),
  },
];

export function landedExtras(
  config: CreateConfig,
): Array<{ name: string; manifest: ExtraManifest }> {
  return installers
    .filter((installer) => installer.shouldRun(config))
    .map((installer) => ({
      name: installer.name,
      manifest: readExtraManifest(installer.name),
    }));
}

export async function runInstallers(config: CreateConfig): Promise<void> {
  if (config.stack !== "next-only") throw new Error("Next installers require the next-only stack");
  for (const installer of installers) {
    if (installer.shouldRun(config)) {
      await installer.run(config);
    }
  }
}
