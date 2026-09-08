import type { CreateConfig } from "./config";
import type { GenerationResult } from "./create-app";

export function formatResult(result: GenerationResult): string {
  return [
    result.message,
    `Stack: ${result.stack ?? "unresolved"}`,
    `Status: ${result.status}`,
    ...(result.failedStage ? [`Failed stage: ${result.failedStage}`] : []),
    `Pending steps: ${result.pendingSteps.join(", ")}`,
    `Recovery: ${result.recovery}`,
  ].join("\n");
}

export function logNextSteps(
  config: CreateConfig,
  result?: GenerationResult,
  output: (text: string) => void = console.log,
): void {
  if (result?.status === "incomplete") return;
  const lines = [
    "Next steps (after required setup and verification):",
    "",
    `  cd ${config.appName}`,
  ];
  if (config.stack !== "next-only") {
    lines.push(
      "  Follow the generated local setup guide for PHP, Composer, PostgreSQL, Redis and local mail.",
      "  bun run setup",
      "  Herd Mail uses the generated project name as its mailbox.",
    );
    if (config.stack === "api-next") lines.push("  Next.js: apps/web", "  Laravel: services/api");
    lines.push(
      "  After initialization: bun run dev; run php artisan horizon in the Laravel root.",
      "  Create the first unverified account separately: php artisan funnysoft:create-first-user.",
    );
    output(lines.join("\n"));
    return;
  }
  if (config.skipInstall) {
    lines.push("  bun run setup", "  Setup is pending until this succeeds.");
  }
  lines.push("  bun run dev", "  bun run check");
  if (config.data === "drizzle" && config.db === "postgres") {
    lines.push("  docker compose up -d && bun run db:migrate");
  } else if (config.data === "drizzle") {
    lines.push("  bun run db:migrate");
  }
  if (config.data === "sanity") {
    lines.push(
      "  Connect Sanity project and dataset manually, then bun run typegen and bun run setup.",
    );
  }
  if (config.playwright) {
    lines.push("  bunx playwright install");
  }
  output(lines.join("\n"));
}
