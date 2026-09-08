import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { installDeps } from "./install";
import {
  checkPrerequisites,
  runCommand,
  type SetupCommand,
  type SetupStack,
} from "./prerequisites";
export type { SetupCommand } from "./prerequisites";

export type SetupResult = {
  status: "initialized" | "setup-pending" | "incomplete";
  stack: SetupStack;
  failedStage: string | null;
  completedStages: string[];
  pendingSteps: string[];
  recovery: string;
  message: string;
};
export function projectDatabase(root: string): string {
  const slug = path
    .basename(root)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 35);
  return `f7t_${slug}_${createHash("sha256").update(path.resolve(root)).digest("hex").slice(0, 8)}`;
}
async function preserveEnvironment(directory: string, database?: string): Promise<void> {
  const target = path.join(directory, ".env");
  try {
    const info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("Environment must be a regular file");
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  let example = await readFile(path.join(directory, ".env.example"), "utf8");
  if (database) {
    example = example
      .replace(/^DB_DATABASE=.*$/m, `DB_DATABASE=${database}`)
      .replace(/^REDIS_PREFIX=.*$/m, `REDIS_PREFIX=${database}:`)
      .replace(/^HORIZON_PREFIX=.*$/m, `HORIZON_PREFIX=${database}:horizon:`)
      .replace(/^REDIS_QUEUE=.*$/m, `REDIS_QUEUE=${database}`);
  }
  await writeFile(target, example, { flag: "wx", mode: 0o600 });
}
const guidance: Record<string, string> = {
  prerequisites: "Check Bun, Composer, PHP extensions and the Herd site's PHP version.",
  environment: "Provide regular .env.example files and preserve your existing .env values.",
  "javascript-dependencies":
    "Check network access and the committed Bun lockfile. Rerun with bun run setup.",
  "php-dependencies":
    "Check network access, composer.lock and preconfigured Composer credentials. For API + Next, authorized Scramble Pro access is mandatory.",
  platform: "Enable the extensions and PHP version required by composer.lock in both CLI and Herd.",
  boost:
    "Check Boost guideline/skill installation in the PHP root and the root skill-sync script. Rerun setup after restoring installed formatting tools and package access.",
  services:
    "Check PostgreSQL authentication, Redis and Herd SMTP at the hosts and ports in .env. Herd defaults: 5432, 6138, 2525; set REDIS_PORT=6379 if your Valkey uses it.",
  "application-key": "Check .env permissions. Existing application keys must remain unchanged.",
  database:
    "Setup only creates its dedicated project database. Check DB_DATABASE and database creation permission; never point setup at a shared database.",
  migrations:
    "Check the database connection. Inspect php artisan migrate in the Laravel root, then rerun setup. Existing rows are preserved.",
  contracts: "Check route/schema generation and private package access, then rerun setup.",
};

export async function initializeProject(
  root: string,
  stack: SetupStack,
  options: { run?: SetupCommand } = {},
): Promise<SetupResult> {
  const run = options.run ?? runCommand;
  const phpRoot = stack === "api-next" ? path.join(root, "services/api") : root;
  const completedStages: string[] = [];
  let failedStage = "prerequisites";
  const stage = async (name: string, action: () => Promise<unknown>) => {
    failedStage = name;
    await action();
    completedStages.push(name);
  };
  let result: SetupResult;
  try {
    await stage("prerequisites", () => checkPrerequisites(stack, phpRoot, run));
    await stage("environment", async () => {
      await preserveEnvironment(phpRoot, stack === "next-only" ? undefined : projectDatabase(root));
      if (stack === "api-next") await preserveEnvironment(path.join(root, "apps/web"));
    });
    await stage("javascript-dependencies", async () => {
      const lock = await lstat(path.join(root, "bun.lock"));
      if (!lock.isFile() || lock.isSymbolicLink())
        throw new Error("A regular Bun release lock is required");
      await installDeps(root, run);
    });
    const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    if (stack !== "next-only") {
      await stage("php-dependencies", async () => {
        const lock = await lstat(path.join(phpRoot, "composer.lock"));
        if (!lock.isFile() || lock.isSymbolicLink())
          throw new Error("A regular Composer release lock is required");
        await run(["composer", "validate", "--strict", "--no-check-all"], phpRoot);
        await run(["composer", "install", "--no-interaction", "--prefer-dist"], phpRoot);
      });
      await stage("platform", async () => {
        await run(["composer", "check-platform-reqs"], phpRoot);
        await run(["herd", "composer", "check-platform-reqs"], phpRoot);
      });
      await stage("boost", async () => {
        await run(
          ["php", "artisan", "boost:install", "--guidelines", "--skills", "--no-interaction"],
          phpRoot,
        );
        await run(["bash", "scripts/boost-sync-opencode-skills.sh"], root);
      });
      const helper = path.join(root, "scripts/setup.php");
      await stage("services", () =>
        run(["php", helper, "services", projectDatabase(root)], phpRoot),
      );
      await stage("application-key", async () => {
        const env = await readFile(path.join(phpRoot, ".env"), "utf8");
        if (!/^APP_KEY=(?!["']?["']?\s*$).+/m.test(env))
          await run(["php", "artisan", "key:generate", "--no-interaction"], phpRoot);
      });
      await stage("database", () =>
        run(["php", helper, "database", projectDatabase(root)], phpRoot),
      );
      await stage("migrations", () =>
        run(["php", "artisan", "migrate", "--no-interaction"], phpRoot),
      );
      await stage("contracts", async () => {
        if (stack === "api-next") await run(["bun", "run", "api:generate"], root);
        else {
          await run(["php", "artisan", "wayfinder:generate", "--with-form"], phpRoot);
          await run(["php", "artisan", "typescript:transform"], phpRoot);
        }
      });
    } else if (pkg.scripts?.["db:migrate"]) {
      await stage("migrations", async () => {
        await run(["bun", "run", "db:generate"], root);
        await run(["bun", "run", "db:migrate"], root);
      });
    }
    const manual = pkg.dependencies?.sanity ? ["connect-sanity"] : [];
    if (stack === "next-only" && pkg.dependencies?.resend) manual.push("connect-resend");
    result = {
      status: manual.length ? "setup-pending" : "initialized",
      stack,
      failedStage: null,
      completedStages,
      pendingSteps: [...manual, "start-processes", "browser-verification"],
      recovery: "bun run setup",
      message: manual.length
        ? "Local initialization complete. External provider connection remains pending."
        : "Initialized and ready to start. Application processes and browser journeys have not been verified.",
    };
  } catch (error) {
    const hint =
      failedStage === "migrations" && stack === "next-only"
        ? "Check DATABASE_URL and bun run db:migrate. Start the generated PostgreSQL service with docker compose up -d when applicable, then rerun setup. Existing rows are preserved."
        : (guidance[failedStage] ?? "Check local configuration and rerun setup.");
    result = {
      status: "incomplete",
      stack,
      failedStage,
      completedStages,
      pendingSteps: [failedStage, "local-setup", "browser-verification"],
      recovery: "bun run setup",
      message: `Setup incomplete at ${failedStage}. ${failedStage === "prerequisites" && error instanceof Error ? error.message : hint}`,
    };
  }
  // Stage markers are diagnostic, never authority to skip a real check on rerun.
  const state = path.join(root, ".f7t");
  await mkdir(state, { recursive: true });
  await writeFile(path.join(state, "setup-state.json"), `${JSON.stringify(result, null, 2)}\n`, {
    mode: 0o600,
  });
  return result;
}

export async function setupMain(stack: SetupStack): Promise<void> {
  const result = await initializeProject(process.cwd(), stack);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "incomplete" ? 1 : 0;
}
