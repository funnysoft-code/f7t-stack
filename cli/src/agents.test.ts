import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("AGENTS.md and env.js rewrite", () => {
  test("AGENTS.md lists sanity and not drizzle", async () => {
    const dir = await gen({ data: "sanity" });
    const agents = await readFile(path.join(dir, "AGENTS.md"), "utf8");
    expect(agents).toContain("Sanity");
    expect(agents).not.toContain("Drizzle");
    expect(agents).toContain("bun run check");
    expect(agents).toContain("~/*");
    expect(agents).toContain("no tRPC");
  });

  test("env.js gains DATABASE_URL only for drizzle", async () => {
    const none = await gen({});
    expect(await readFile(path.join(none, "src/env.js"), "utf8")).not.toContain("DATABASE_URL");
    const drizzle = await gen({ data: "drizzle" });
    expect(await readFile(path.join(drizzle, "src/env.js"), "utf8")).toContain("DATABASE_URL");
  });
});
