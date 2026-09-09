import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { expect, test } from "vitest";
import { projectDatabase } from "./setup";

const fixture = process.env.F7T_SETUP_LARAVEL_FIXTURE;
const exec = promisify(execFile);

test.skipIf(!fixture).each([
  ["PostgreSQL unavailable", { DB_PORT: "1" }],
  ["Redis unavailable", { REDIS_PORT: "1" }],
  ["SMTP unavailable", { MAIL_PORT: "1" }],
  ["shared database refused", { DB_DATABASE: "postgres" }],
  ["shared Redis namespace refused", { REDIS_PREFIX: "shared:" }],
  ["production setup refused", { APP_ENV: "production" }],
] as const)("real helper fails closed: %s", async (_name, overrides) => {
  const root = path.resolve(fixture!);
  expect(root).toContain("/opencode/u12-");
  const result = await exec(
    "php",
    [path.join(root, "scripts/setup.php"), "services", projectDatabase(root)],
    { cwd: root, env: { ...process.env, ...overrides } },
  ).then(
    () => ({ code: 0 }),
    (error) => ({ code: error.code, output: String(error.stdout) + String(error.stderr) }),
  );
  expect(result.code).toBe(1);
});
