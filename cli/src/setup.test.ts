import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "vitest";
import { initializeProject, type SetupCommand } from "./setup";
import { runCommand } from "./prerequisites";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function project(stack = "inertia-monolith") {
  const root = await mkdtemp(path.join(tmpdir(), "u12-"));
  dirs.push(root);
  const php = stack === "api-next" ? path.join(root, "services/api") : root;
  await mkdir(php, { recursive: true });
  if (stack === "api-next") {
    await mkdir(path.join(root, "apps/web"), { recursive: true });
    await writeFile(
      path.join(root, "apps/web/.env.example"),
      "FRONTEND_URL=http://localhost:3000\n",
    );
  }
  await writeFile(
    path.join(php, ".env.example"),
    "APP_ENV=local\nAPP_KEY=\nDB_DATABASE=example\nREDIS_PREFIX=example:\n",
  );
  await writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: {} }));
  await writeFile(path.join(root, "bun.lock"), "fixture-lock");
  await writeFile(path.join(php, "composer.lock"), "fixture-lock");
  return root;
}
const successful: SetupCommand = async (command) =>
  command[0] === "bun" ? "1.4.0" : command[0] === "composer" ? "Composer version 2.9.0" : "80500";
describe("guided setup", () => {
  test.each([
    ["bun.lock", "javascript-dependencies"],
    ["composer.lock", "php-dependencies"],
  ])("missing %s never resolves an unlocked graph", async (file, stage) => {
    const root = await project();
    await rm(path.join(root, file!));
    expect(await initializeProject(root, "inertia-monolith", { run: successful })).toMatchObject({
      status: "incomplete",
      failedStage: stage,
    });
  });
  test("a stale Composer lock stops before Composer install", async () => {
    const root = await project("api-next");
    const calls: string[] = [];
    const run: SetupCommand = async (command, cwd) => {
      calls.push(command.join(" "));
      if (command.includes("validate")) throw new Error("lock mismatch");
      return successful(command, cwd);
    };
    expect(await initializeProject(root, "api-next", { run })).toMatchObject({
      status: "incomplete",
      failedStage: "php-dependencies",
    });
    expect(calls).toContain("composer validate --no-check-publish");
    expect(calls).not.toContain("composer install --no-interaction --prefer-dist");
  });
  test.each([
    ["private dependency denied", "composer install", "php-dependencies"],
    ["network download failed", "bun install", "javascript-dependencies"],
    ["migration process failed", "artisan migrate", "migrations"],
    ["contract process failed", "artisan wayfinder:generate", "contracts"],
  ])(
    "%s from a real subprocess retains its stage and suppresses output",
    async (_reason, match, stage) => {
      const root = await project();
      const run: SetupCommand = (command, cwd) =>
        command.join(" ").includes(match!)
          ? runCommand(
              [
                process.execPath,
                "-e",
                "process.stdout.write('private-secret');process.stderr.write('private-secret');process.exit(1)",
              ],
              cwd,
            )
          : successful(command, cwd);
      const result = await initializeProject(root, "inertia-monolith", { run });
      expect(result).toMatchObject({
        status: "incomplete",
        failedStage: stage,
        recovery: "bun run setup",
      });
      expect(JSON.stringify(result)).not.toContain("private-secret");
    },
  );

  test("a missing executable is an incomplete prerequisite, never a ready result", async () => {
    const root = await project();
    const run: SetupCommand = (_command, cwd) => runCommand([path.join(root, "missing-bun")], cwd);
    expect(await initializeProject(root, "next-only", { run })).toMatchObject({
      status: "incomplete",
      failedStage: "prerequisites",
    });
  });

  test("an absent safe environment example fails before dependencies", async () => {
    const root = await project();
    await rm(path.join(root, ".env.example"));
    expect(await initializeProject(root, "next-only", { run: successful })).toMatchObject({
      status: "incomplete",
      failedStage: "environment",
    });
  });
  test.each([
    ["javascript-dependencies", "bun install"],
    ["php-dependencies", "composer install"],
    ["platform", "composer check-platform-reqs"],
    ["services", "setup.php services"],
    ["database", "setup.php database"],
    ["migrations", "artisan migrate"],
    ["contracts", "artisan wayfinder:generate"],
  ])("%s failure is incomplete, redacted and resumable", async (stage, match) => {
    const root = await project();
    const run: SetupCommand = async (command) => {
      if (command.join(" ").includes(match!)) throw new Error("unauthorized network secret");
      return successful(command, root);
    };
    const result = await initializeProject(root, "inertia-monolith", { run });
    expect(result.status).toBe("incomplete");
    expect(result.failedStage).toBe(stage);
    expect(result.recovery).toBe("bun run setup");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.parse(await readFile(path.join(root, ".f7t/setup-state.json"), "utf8"))).toEqual(
      result,
    );
  });
  test("reruns recheck dependencies and preserve all local bytes without creating a user", async () => {
    const root = await project();
    const env = "APP_ENV=local\nAPP_KEY=preserve-key\nDB_DATABASE=preserve-database\n";
    await writeFile(path.join(root, ".env"), env);
    await writeFile(path.join(root, "notes.txt"), "user work");
    const commands: string[] = [];
    const run: SetupCommand = async (command) => {
      commands.push(command.join(" "));
      return successful(command, root);
    };
    for (let i = 0; i < 2; i++)
      expect((await initializeProject(root, "inertia-monolith", { run })).status).toBe(
        "initialized",
      );
    expect(await readFile(path.join(root, ".env"), "utf8")).toBe(env);
    expect(await readFile(path.join(root, "notes.txt"), "utf8")).toBe("user work");
    expect(commands.filter((c) => c.includes("bun install"))).toHaveLength(2);
    expect(commands.join("\n")).not.toMatch(/key:generate|first-user|db:seed|migrate:fresh/);
  });
  test("API uses backend root and regenerates contracts from workspace root", async () => {
    const root = await project("api-next");
    const calls: [string[], string][] = [];
    const run: SetupCommand = async (command, cwd) => {
      calls.push([command, cwd]);
      return successful(command, cwd);
    };
    expect((await initializeProject(root, "api-next", { run })).status).toBe("initialized");
    expect(calls).toContainEqual([
      ["composer", "install", "--no-interaction", "--prefer-dist"],
      path.join(root, "services/api"),
    ]);
    expect(calls).toContainEqual([["bun", "run", "api:generate"], root]);
  });
  test.each(["sqlite", "postgres"])(
    "Next Drizzle %s generates and applies migrations",
    async () => {
      const root = await project("next-only");
      await writeFile(
        path.join(root, "package.json"),
        JSON.stringify({
          scripts: { "db:generate": "drizzle-kit generate", "db:migrate": "drizzle-kit migrate" },
        }),
      );
      const calls: string[] = [];
      const run: SetupCommand = async (command) => {
        calls.push(command.join(" "));
        return successful(command, root);
      };
      expect((await initializeProject(root, "next-only", { run })).status).toBe("initialized");
      expect(calls).toContain("bun run db:generate");
      expect(calls).toContain("bun run db:migrate");
    },
  );
  test("Sanity reports manual connection as pending", async () => {
    const root = await project("next-only");
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ dependencies: { sanity: "1" } }),
    );
    expect(await initializeProject(root, "next-only", { run: successful })).toMatchObject({
      status: "setup-pending",
      pendingSteps: expect.arrayContaining(["connect-sanity"]),
    });
  });
  test("Next migration recovery stays in the selected JavaScript stack", async () => {
    const root = await project("next-only");
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { "db:migrate": "drizzle-kit migrate" } }),
    );
    const run: SetupCommand = async (command, cwd) => {
      if (command.includes("db:migrate")) throw new Error("connection failed");
      return successful(command, cwd);
    };
    const result = await initializeProject(root, "next-only", { run });
    expect(result).toMatchObject({ status: "incomplete", failedStage: "migrations" });
    expect(result.message).toContain("bun run db:migrate");
    expect(result.message).not.toMatch(/php|Composer|Herd/);
  });
});
