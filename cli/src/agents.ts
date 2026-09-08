import { writeFile } from "node:fs/promises";
import type { CreateConfig } from "./config";
import { regularPackagePath } from "./paths";
import { stacks, type StackId } from "./stacks";

export type ProjectBrief = {
  target: string;
  variant: StackId;
  productBlurb: string;
};

/** The brief activates policy because OpenCode V2 does not load instructions entries. */
export async function writeProjectBrief(options: ProjectBrief): Promise<void> {
  const definition = stacks[options.variant];
  const php = definition.phpRoot;
  const design =
    options.variant === "next-only"
      ? null
      : options.variant === "api-next"
        ? "packages/design-system/DESIGN.md"
        : "design/DESIGN.md";
  const lines = [
    "# Project brief",
    "",
    options.productBlurb.replace(/[\r\n]+/g, " "),
    "",
    "Before work, read the applicable `.opencode/rules/*.md` files and the pinned `docs/playbook/README.md`.",
    "",
    `Stack: ${definition.label}. JS roots: ${definition.jsRoots.map((root) => `\`${root}\``).join(", ")}.`,
    "Standards identity: `STANDARDS_VERSION` and `STANDARDS_MANIFEST.json`. Generator identity: `F7T_MANIFEST.json`.",
    ...(design ? [`Design authority: \`${design}\`.`] : []),
    "",
    "Run `bun run check` from the repository root. Install the locked dependencies before running gates. Run `bun run hooks:install` after Git initialization.",
    ...(php
      ? [
          `PHP root: \`${php}\`. Run Composer and Artisan there.`,
          "After `php artisan boost:update --ansi`, run `bash scripts/boost-sync-opencode-skills.sh` from the repository root. Root `.opencode/skills` contains portable real files.",
          "Boost may append guidelines to this brief; retain its policy-entry instruction.",
        ]
      : []),
    ...(options.variant === "api-next"
      ? [
          "After API contract changes, run `bun run api:generate`. `bun run check:schema` compares a fresh Laravel export and generated types; `bun run check:workflows` validates `tests/workflows.yml` against tagged `e2e/` journeys.",
        ]
      : []),
    "",
    "Keep product decisions in repository docs. Never commit secrets or copy personal OpenCode providers, models, permissions, or global configuration.",
    "",
  ];
  await writeFile(regularPackagePath(options.target, "AGENTS.md", true), lines.join("\n"));
}

export async function writeAgents(config: CreateConfig): Promise<void> {
  await writeProjectBrief({
    target: config.projectDir,
    variant: config.stack,
    productBlurb: `${config.appName} application`,
  });
}
