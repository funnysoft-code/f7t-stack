import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateConfig } from "./config";

export async function writeAgents(config: CreateConfig): Promise<void> {
  await writeFile(path.join(config.projectDir, "AGENTS.md"), `# ${config.appName}\n`);
}
