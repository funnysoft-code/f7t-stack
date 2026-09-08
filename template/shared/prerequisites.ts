import { spawn } from "node:child_process";

export type SetupCommand = (command: string[], cwd: string) => Promise<string>;
export type SetupStack = "next-only" | "inertia-monolith" | "api-next";

/** Never forward package-manager output: it may contain authenticated URLs. */
export const runCommand: SetupCommand = (command, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command[0]!, command.slice(1), {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      if (output.length < 65536) output += chunk.toString();
    });
    child.on("error", () => reject(new Error("Command unavailable")));
    child.on("close", (code) =>
      code === 0 ? resolve(output.trim()) : reject(new Error("Command failed")),
    );
  });

export async function checkPrerequisites(
  stack: SetupStack,
  cwd: string,
  run: SetupCommand = runCommand,
): Promise<void> {
  const check = async (command: string[], valid: (output: string) => boolean, guidance: string) => {
    try {
      if (valid(await run(command, cwd))) return;
    } catch {
      /* Only emit our own nonsecret guidance. */
    }
    throw new Error(guidance);
  };
  await check(
    ["bun", "--version"],
    (value) => /^(1\.(?:[4-9]|[1-9]\d+)\.|[2-9]\.)/.test(value),
    "Install bun >=1.4 before rerunning setup.",
  );
  if (stack === "next-only") return;
  await check(
    ["composer", "--version"],
    (value) => /Composer version 2\./.test(value),
    "Install composer 2 and configure private package access outside this project.",
  );
  const compatible = (value: string) => Number(value) >= 80500 && Number(value) < 90000;
  await check(
    ["php", "-r", "echo PHP_VERSION_ID;"],
    compatible,
    "Select php 8.5 or newer PHP 8.x for the CLI.",
  );
  await check(
    ["herd", "php", "-r", "echo PHP_VERSION_ID;"],
    compatible,
    "Install herd and select PHP 8.5 for this site: herd isolate 8.5.",
  );
  const extensions = [
    "ctype",
    "curl",
    "dom",
    "fileinfo",
    "filter",
    "hash",
    "intl",
    "mbstring",
    "openssl",
    "pcntl",
    "pdo_pgsql",
    "redis",
    "session",
    "tokenizer",
    "xml",
    "zlib",
  ];
  for (const prefix of [["php"], ["herd", "php"]]) {
    await check(
      [
        ...prefix,
        "-r",
        `foreach (${JSON.stringify(extensions).replaceAll('"', "'")} as $extension) { if (!extension_loaded($extension)) exit(1); }`,
      ],
      () => true,
      `${prefix.join(" ")} needs extensions: ${extensions.join(", ")}. Enable them for the CLI and Herd site, then rerun setup.`,
    );
  }
}
