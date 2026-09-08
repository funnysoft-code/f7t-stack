import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export class CookieSession {
  private values = new Map<string, string>();
  constructor(readonly origin: string) {}
  cookie(): string {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join("; ");
  }
  csrf(): string {
    return decodeURIComponent(this.values.get("XSRF-TOKEN") ?? "");
  }
  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("cookie", this.cookie());
    const response = await fetch(`${this.origin}${path}`, { ...init, headers, redirect: "manual" });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      this.values.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  }
  mutate(path: string, body: unknown = {}, extra: HeadersInit = {}): Promise<Response> {
    return this.request(path, {
      method: "POST",
      headers: {
        origin: this.origin,
        "content-type": "application/json",
        "x-xsrf-token": this.csrf(),
        ...extra,
      },
      body: JSON.stringify(body),
    });
  }
}

async function stop(child: ChildProcess | undefined): Promise<void> {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((done) => child.once("exit", () => done()));
  process.kill(-child.pid, "SIGTERM");
  await exited;
}

/** Real processes, dedicated cookies, namespaced Redis keys and owned account records. No HTTP mocks. */
export async function startServers(port: number) {
  const directory = mkdtempSync(join(tmpdir(), "f7t-transport-"));
  const prefix = `u16-${randomUUID()}-`;
  const frontend = `http://127.0.0.1:${port}`;
  const upstream = `http://127.0.0.1:${port + 4000}`;
  const password = randomBytes(24).toString("hex");
  const emails = {
    first: `${prefix}first@example.test`,
    second: `${prefix}second@example.test`,
    unverified: `${prefix}unverified@example.test`,
  };
  const backend = join(directory, "services/api");
  const web = join(directory, "apps/web");
  const env = {
    ...process.env,
    APP_NAME: "U16 Transport",
    APP_ENV: "local",
    APP_DEBUG: "false",
    APP_KEY: `base64:${randomBytes(32).toString("base64")}`,
    APP_URL: upstream,
    FRONTEND_URL: frontend,
    API_UPSTREAM_URL: upstream,
    DB_DATABASE: process.env.F7T_TRANSPORT_DATABASE ?? "f7t_transport_test",
    DB_USERNAME: process.env.DB_USERNAME ?? "postgres",
    SESSION_DOMAIN: "",
    SESSION_SECURE_COOKIE: "false",
    SESSION_COOKIE: `${prefix}session`,
    SESSION_DRIVER: "redis",
    CACHE_STORE: "redis",
    CACHE_PREFIX: prefix,
    REDIS_PREFIX: prefix,
    HORIZON_PREFIX: `${prefix}horizon:`,
    REDIS_DB: "13",
    REDIS_CACHE_DB: "14",
    REDIS_SESSION_DB: "15",
    MAIL_MAILER: "array",
    NIGHTWATCH_ENABLED: "false",
    QUEUE_CONNECTION: "sync",
    BCRYPT_ROUNDS: "4",
    TRANSPORT_PASSWORD: password,
    TRANSPORT_PREFIX: prefix,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  const excluded = new Set([
    "node_modules",
    "vendor",
    ".next",
    ".env",
    "storage",
    "cache",
    "coverage",
  ]);
  function copy(from: string, to: string) {
    cpSync(from, to, { recursive: true, filter: (path) => !excluded.has(path.split("/").at(-1)!) });
  }
  copy(join(root, "services/api"), backend);
  copy(join(root, "apps/web"), web);
  copy(join(root, "packages"), join(directory, "packages"));
  cpSync(join(root, "tsconfig.json"), join(directory, "tsconfig.json"));
  cpSync(join(root, "package.json"), join(directory, "package.json"));
  symlinkSync(join(root, "node_modules"), join(directory, "node_modules"));
  symlinkSync(join(root, "apps/web/node_modules"), join(web, "node_modules"));
  symlinkSync(join(root, "services/api/vendor"), join(backend, "vendor"));
  for (const path of [
    "bootstrap/cache",
    "storage/framework/cache/data",
    "storage/framework/sessions",
    "storage/framework/views",
    "storage/logs",
  ])
    mkdirSync(join(backend, path), { recursive: true });
  const routes = join(backend, "routes/web.php");
  writeFileSync(
    routes,
    `${readFileSync(routes, "utf8")}
Illuminate\\Support\\Facades\\Route::get('/api/transport/headers', fn () => response()->json(['origin' => request()->header('Origin'), 'referer' => request()->header('Referer')]))->middleware('throttle:docs');
Illuminate\\Support\\Facades\\Route::get('/api/transport/redirect', fn () => response('', 302, ['Location' => request()->query('to')]))->middleware('throttle:docs');
`,
  );
  mkdirSync(join(web, "app/transport-identity"), { recursive: true });
  writeFileSync(
    join(web, "app/transport-identity/page.tsx"),
    `import { serverRead } from "@/lib/api/server";
export const dynamic = "force-dynamic";
export default async function Page() { const [response, transport] = await Promise.all([serverRead("/api/auth/me"), serverRead("/api/transport/headers")]); const identity = await response.json(); return <pre>{JSON.stringify({status: response.status, identity, transport: await transport.json()})}</pre>; }
`,
  );

  function php(code: string, extra: Record<string, string> = {}): string {
    const result = spawnSync("php", [], {
      cwd: backend,
      env: { ...env, ...extra },
      input: `<?php require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); ${code}; echo '\nTRANSPORT_OK';`,
      encoding: "utf8",
    });
    if (result.status !== 0 || !result.stdout.trim().endsWith("TRANSPORT_OK"))
      throw new Error("Transport fixture PHP operation failed (details intentionally withheld)");
    return result.stdout.trim();
  }
  let next: ChildProcess | undefined;
  let laravel: ChildProcess | undefined;
  function launch(command: string, args: string[], cwd: string): ChildProcess {
    // Never capture request headers, bodies or Laravel's exception diagnostics in test output.
    return spawn(command, args, { cwd, env, detached: true, stdio: "ignore" });
  }
  async function ready(url: string, child: ChildProcess) {
    for (let attempt = 0; attempt < 180; attempt++) {
      if (child.exitCode !== null)
        throw new Error(`Transport process exited before readiness: ${new URL(url).port}`);
      try {
        if ((await fetch(url)).ok) return;
      } catch {
        /* Process is still starting. */
      }
      await new Promise((done) => setTimeout(done, 250));
    }
    throw new Error(`Transport process readiness timed out: ${new URL(url).port}`);
  }
  async function close() {
    await Promise.all([stop(next), stop(laravel)]);
    try {
      php(`Modules\\Identity\\Models\\Users\\User::query()->where('email', 'like', getenv('TRANSPORT_PREFIX').'%@example.test')->get()->each->delete();
foreach (['default', 'cache', 'sessions'] as $name) { $client = Illuminate\\Support\\Facades\\Redis::connection($name)->client(); $iterator = null; do { $keys = $client->scan($iterator, getenv('TRANSPORT_PREFIX').'*', 100); if ($keys) { $client->rawCommand('UNLINK', ...$keys); } } while ($iterator !== 0); }`);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
  try {
    if (!existsSync(join(backend, "vendor/autoload.php")))
      throw new Error("Install backend dependencies before transport tests");
    php(`Illuminate\\Support\\Facades\\Artisan::call('migrate', ['--force' => true]);
foreach (['first', 'second', 'unverified'] as $name) { $user = Modules\\Identity\\Models\\Users\\User::query()->create(['name' => $name, 'email' => getenv('TRANSPORT_PREFIX').$name.'@example.test', 'password' => getenv('TRANSPORT_PASSWORD')]); if ($name !== 'unverified') $user->markEmailAsVerified(); }`);
    laravel = launch(
      "php",
      [
        "-S",
        `127.0.0.1:${port + 4000}`,
        join(
          root,
          "services/api/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php",
        ),
      ],
      join(backend, "public"),
    );
    await ready(`${upstream}/up`, laravel);
    const nextCli = join(root, "apps/web/node_modules/next/dist/bin/next");
    const build = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
      cwd: web,
      env,
      stdio: "ignore",
      timeout: 120_000,
    });
    if (build.status !== 0) throw new Error("Transport fixture Next production build failed");
    next = launch(
      process.execPath,
      [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      web,
    );
    await ready(`${frontend}/health`, next);
  } catch (error) {
    await close();
    throw error;
  }

  return {
    frontend,
    upstream,
    emails,
    close,
    session: () => new CookieSession(frontend),
    async login(session: CookieSession, account: keyof typeof emails = "first", remember = false) {
      const csrf = await session.request("/api/auth/csrf-cookie");
      if (csrf.status !== 204) throw new Error(`CSRF initialization failed: ${csrf.status}`);
      return session.mutate("/api/auth/login", { email: emails[account], password, remember });
    },
    async loginInBrowser(page: Page, account: keyof typeof emails = "first") {
      await page.goto(`${frontend}/health`);
      return page.evaluate(
        async ({ email, password }) => {
          await fetch("/api/auth/csrf-cookie", { credentials: "same-origin" });
          const token = document.cookie.split("; ").find((part) => part.startsWith("XSRF-TOKEN="));
          const response = await fetch("/api/auth/login", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "content-type": "application/json",
              "x-xsrf-token": decodeURIComponent(token!.slice("XSRF-TOKEN=".length)),
            },
            body: JSON.stringify({ email, password }),
          });
          return response.status;
        },
        { email: emails[account], password },
      );
    },
    permission(account: keyof typeof emails, grant: boolean) {
      php(
        `$status = Illuminate\\Support\\Facades\\Artisan::call('funnysoft:horizon-permission', ['operation' => getenv('TRANSPORT_ACTION'), 'email' => getenv('TRANSPORT_EMAIL')]); if ($status !== 0) exit(1);`,
        { TRANSPORT_ACTION: grant ? "grant" : "revoke", TRANSPORT_EMAIL: emails[account] },
      );
    },
    async outage() {
      await stop(laravel);
    },
    expireSessions() {
      php(
        `$client = Illuminate\\Support\\Facades\\Redis::connection('sessions')->client(); $iterator = null; do { $keys = $client->scan($iterator, getenv('TRANSPORT_PREFIX').'*', 100); if ($keys) $client->rawCommand('UNLINK', ...$keys); } while ($iterator !== 0);`,
      );
    },
  };
}

export type TransportServers = Awaited<ReturnType<typeof startServers>>;
