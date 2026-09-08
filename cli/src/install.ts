import { spawn } from "node:child_process";

function runBunInstall(projectDir: string): Promise<number> {
  const bunGlobal = (
    globalThis as unknown as {
      Bun?: {
        spawn: (
          cmd: string[],
          opts: { cwd: string; stdout?: "ignore"; stderr?: "ignore" },
        ) => { exited: Promise<number> };
      };
    }
  ).Bun;
  if (bunGlobal) {
    return bunGlobal.spawn(["bun", "install", "--frozen-lockfile"], {
      cwd: projectDir,
      stdout: "ignore",
      stderr: "ignore",
    }).exited;
  }
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["install", "--frozen-lockfile"], {
      cwd: projectDir,
      stdio: "ignore",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

export async function installDeps(projectDir: string): Promise<void> {
  const code = await runBunInstall(projectDir);
  if (code !== 0) {
    throw new Error(`bun install exited with code ${code}`);
  }
}
