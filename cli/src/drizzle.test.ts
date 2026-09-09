import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("drizzle extras", () => {
  test("sqlite has no compose and no Post table", async () => {
    const dir = await gen({ data: "drizzle" });
    const schema = await readFile(path.join(dir, "src/server/db/schema.ts"), "utf8");
    expect(schema.toLowerCase()).not.toContain("post");
    await expect(stat(path.join(dir, "compose.yaml"))).rejects.toMatchObject({ code: "ENOENT" });
    const example = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(example).toContain("file:./dev.db");
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.scripts["db:migrate"]).toBe("bun scripts/migrate.ts");
    expect(await readFile(path.join(dir, "scripts/migrate.ts"), "utf8")).toContain(
      "drizzle-orm/bun-sqlite/migrator",
    );
    expect(pkg.devDependencies["@types/bun"]).toBe("1.4.0");
  });

  test("postgres adds compose and a postgres URL", async () => {
    const dir = await gen({ data: "drizzle", db: "postgres" });
    const compose = await readFile(path.join(dir, "compose.yaml"), "utf8");
    expect(compose).toContain("postgres");
    const example = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(example).toContain("postgres://");
    await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
