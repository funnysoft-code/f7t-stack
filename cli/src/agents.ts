import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateConfig } from "./config";
import { landedExtras } from "./installers";

const STACK_LABELS: Record<string, string> = {
  sanity: "Sanity",
  "drizzle-sqlite": "Drizzle (SQLite)",
  "drizzle-postgres": "Drizzle (Postgres)",
  "next-intl": "next-intl",
  "shell-site": "Site shell",
  "shell-app": "App shell",
  shadcn: "ShadCN UI",
  resend: "Resend",
  playwright: "Playwright",
  "harness-grok": "Grok harness",
  "harness-cursor": "Cursor harness",
  "github-actions": "GitHub Actions",
};

function layoutLines(names: Set<string>): string[] {
  const lines: string[] = [];
  if (names.has("next-intl")) {
    lines.push("- `src/app/[locale]/` pages");
    lines.push("- `src/i18n/` next-intl routing");
    lines.push("- `messages/` catalogs");
  } else {
    lines.push("- `src/app/` App Router pages");
  }
  lines.push("- `src/env.js` env schema");
  if (names.has("shell-site") || names.has("shell-app")) {
    lines.push("- `src/lib/site.ts` copy and nav");
  }
  if (names.has("sanity")) {
    lines.push("- `src/app/studio/` Sanity Studio");
    lines.push("- `src/sanity/` schema and client");
  }
  if (names.has("drizzle-sqlite") || names.has("drizzle-postgres")) {
    lines.push("- `src/server/db/` Drizzle");
  }
  if (names.has("shadcn")) {
    lines.push("- `src/components/ui/` ShadCN UI");
    lines.push("- `src/lib/utils.ts` `cn` helper");
  }
  if (names.has("resend")) {
    lines.push("- `src/app/api/contact/` Resend contact Route Handler");
  }
  if (names.has("playwright")) {
    lines.push("- `e2e/` Playwright");
  }
  return lines;
}

export async function writeAgents(config: CreateConfig): Promise<void> {
  const extras = landedExtras(config);
  const names = new Set(extras.map((extra) => extra.name));
  const shellLabel = config.shell === "site" ? "Site" : "App";
  const stack = [
    "- bun",
    "- Next.js App Router, React 19, TypeScript strict",
    "- Tailwind CSS v4",
    "- oxlint, oxfmt, vitest, React Doctor",
    "- `@t3-oss/env-nextjs`",
    ...extras.map((extra) => `- ${STACK_LABELS[extra.name] ?? extra.name}`),
  ];
  const extraScripts = extras.flatMap((extra) =>
    Object.keys(extra.manifest.package?.scripts ?? {}),
  );
  const commands = [
    "- `bun install`",
    "- `bun run dev`",
    "- `bun run check`",
    "- `bun run build`",
    ...extraScripts.map((script) => `- \`bun run ${script}\``),
  ];
  const extraAgents = extras
    .map((extra) => extra.manifest.agents?.trim())
    .filter((block): block is string => Boolean(block));
  const extraBlock = extraAgents.length > 0 ? `\n${extraAgents.join("\n\n")}\n` : "";
  const doNot = [
    "- Commit secrets or print them in logs",
    "- Force-push",
    "- Drive-by refactors",
    "- Hand-edit ignored generated files",
  ];
  if (names.has("sanity")) {
    doNot.push("- Hand-edit generated Sanity `schema.json` or types");
  }

  const markdown = `# ${config.appName}

${config.appName} is a Next.js ${shellLabel}.

## Stack

${stack.join("\n")}

## Commands

${commands.join("\n")}
${extraBlock}
## src/

${layoutLines(names).join("\n")}

## Conventions

- Import alias \`~/*\` maps to \`src/*\`
- bun only. Do not add npm, pnpm, or yarn
- APIs are Route Handlers plus Zod. no tRPC

## Do not

${doNot.join("\n")}
`;

  await writeFile(path.join(config.projectDir, "AGENTS.md"), markdown);
}
