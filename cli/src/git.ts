import { spawn } from "node:child_process";

function run(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "ignore", env: process.env });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

export async function initGit(dir: string): Promise<void> {
  try {
    if ((await run("git", ["--version"], dir)) !== 0) {
      console.warn("Git is not installed. Skipping git init.");
      return;
    }
  } catch {
    console.warn("Git is not installed. Skipping git init.");
    return;
  }

  try {
    if ((await run("git", ["init"], dir)) !== 0) {
      console.warn("git init failed. Skipping.");
    }
  } catch {
    console.warn("Git is not installed. Skipping git init.");
  }
}
