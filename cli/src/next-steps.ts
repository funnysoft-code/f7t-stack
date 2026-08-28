import type { CreateConfig } from "./config";

export function logNextSteps(config: CreateConfig): void {
  const lines = ["Next steps:", "", `  cd ${config.appName}`];
  if (config.skipInstall) {
    lines.push("  bun install");
  }
  lines.push("  bun run dev", "  bun run check");
  if (config.data === "drizzle" && config.db === "postgres") {
    lines.push("  docker compose up -d && bun run db:migrate");
  } else if (config.data === "drizzle") {
    lines.push("  bun run db:migrate");
  }
  if (config.data === "sanity") {
    lines.push("  bun run typegen");
  }
  if (config.playwright) {
    lines.push("  bunx playwright install");
  }
  console.log(lines.join("\n"));
}
