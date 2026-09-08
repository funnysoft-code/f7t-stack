import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Laravel to OpenAPI to TypeScript freshness", () => {
  it("rejects changed backend output while both saved contracts remain unchanged", () => {
    const directory = mkdtempSync(join(tmpdir(), "f7t-contract-"));
    try {
      const excluded = new Set(["vendor", "node_modules", ".env", "cache", "storage"]);
      for (const path of ["services/api", "packages/api-client", "scripts"]) {
        cpSync(join(root, path), join(directory, path), {
          recursive: true,
          filter: (path) => !excluded.has(path.split("/").at(-1)!),
        });
      }
      symlinkSync(join(root, "node_modules"), join(directory, "node_modules"));
      const vendor = join(directory, "services/api/vendor");
      mkdirSync(vendor, { recursive: true });
      // Composer's application paths are relative to vendor/composer. A whole-vendor
      // symlink would silently load the original app instead of the changed copy.
      for (const entry of readdirSync(join(root, "services/api/vendor"))) {
        const source = join(root, "services/api/vendor", entry);
        const target = join(vendor, entry);
        if (["composer", "autoload.php"].includes(entry))
          cpSync(source, target, { recursive: true });
        else symlinkSync(source, target);
      }
      for (const path of [
        "bootstrap/cache",
        "storage/framework/cache/data",
        "storage/framework/sessions",
        "storage/framework/views",
        "storage/logs",
      ])
        mkdirSync(join(directory, "services/api", path), { recursive: true });
      const run = () =>
        spawnSync("bash", ["scripts/generate-api-client.sh", "--check"], {
          cwd: directory,
          encoding: "utf8",
          env: {
            ...process.env,
            APP_ENV: "testing",
            APP_URL: "http://localhost:8000",
            DB_DATABASE: process.env.F7T_TRANSPORT_DATABASE ?? "f7t_transport_test",
            DB_USERNAME: process.env.DB_USERNAME ?? "postgres",
            FUNNYSOFT_REGISTRATION_ENABLED: "false",
            NIGHTWATCH_ENABLED: "false",
          },
        });
      const artifacts = ["packages/api-client/openapi.json", "packages/api-client/src/schema.d.ts"];
      const before = artifacts.map((path) => readFileSync(join(directory, path), "utf8"));
      const schema = JSON.parse(before[0]!);
      for (const path of ["/auth/register", "/auth/forgot-password"]) {
        const body = schema.paths[path].post.requestBody.content["application/json"].schema;
        expect(body.properties.turnstile_token.type).toBe("string");
        expect(body.required).not.toContain("turnstile_token");
      }
      const clean = run();
      expect(clean.status, clean.stdout + clean.stderr).toBe(0);
      const resource = join(
        directory,
        "services/api/Modules/Identity/Http/Resources/UserResource.php",
      );
      const source = readFileSync(resource, "utf8");
      expect(source).toContain("'email_verified' =>");
      writeFileSync(
        resource,
        source.replace("'email_verified' =>", "'contract_probe' => true, 'email_verified' =>"),
      );
      const stale = run();
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain("OpenAPI is stale");
      expect(artifacts.map((path) => readFileSync(join(directory, path), "utf8"))).toEqual(before);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 60_000);
});
