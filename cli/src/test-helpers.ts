import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import type { FlagInput } from "./config";
import { resolveConfig } from "./config";
import { createApp } from "./create-app";

const dirs: string[] = [];

export function trackTempDirs(): void {
  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });
}

export async function gen(
  flags: Omit<FlagInput, "appName"> & { appName?: string } = {},
): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), "f7t-"));
  dirs.push(cwd);
  const config = resolveConfig(
    {
      appName: "shop",
      yes: true,
      skipInstall: true,
      githubActions: false,
      ...flags,
    },
    cwd,
  );
  await createApp(config);
  return config.projectDir;
}
