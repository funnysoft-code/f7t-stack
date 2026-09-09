import { existsSync, readFileSync } from "node:fs";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { appPagesRoot } from "./app-root";
import type { CreateConfig } from "./config";
import { appendEnvExample, appendGlobalsCss, copyExtra, mergePackageJson } from "./fs";
import { templateDir } from "./paths";

async function runShell(name: string, config: CreateConfig): Promise<void> {
  await copyExtra(name, config, { appPrefix: true });
  if (config.intl) {
    const page = path.join(config.projectDir, appPagesRoot(config), "page.tsx");
    await writeFile(
      page,
      (await readFile(page, "utf8")).replace(
        'import Link from "next/link";',
        'import { Link } from "~/i18n/navigation";',
      ),
    );
  }
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
  // These are selected integration APIs, not dead code or lint exclusions.
  // React Doctor reads Knip entry points while still scanning their implementation.
  const entry = [
    ...(config.data === "sanity" ? ["src/sanity/lib/site-settings.ts"] : []),
    ...(config.data === "drizzle" ? ["src/server/db/index.ts", "src/server/db/schema.ts"] : []),
    ...(config.shadcn ? ["src/components/ui/button.tsx"] : []),
    ...(config.intl ? ["src/i18n/navigation.ts"] : []),
  ];
  if (entry.length) {
    const inline = `[${entry.map((file) => JSON.stringify(file)).join(", ")}]`;
    const formatted =
      inline.length + '  "entry": '.length <= 100
        ? inline
        : `[\n${entry.map((file) => `    ${JSON.stringify(file)}`).join(",\n")}\n  ]`;
    await writeFile(path.join(config.projectDir, "knip.json"), `{\n  "entry": ${formatted}\n}\n`);
  }
}
