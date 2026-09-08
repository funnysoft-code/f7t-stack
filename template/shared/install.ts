import { runCommand, type SetupCommand } from "./prerequisites";

export async function installDeps(
  projectDir: string,
  run: SetupCommand = runCommand,
): Promise<void> {
  await run(["bun", "install", "--frozen-lockfile"], projectDir);
}
