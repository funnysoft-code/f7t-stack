import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("sanity extra", () => {
  test("sanity extra lands studio and not drizzle", async () => {
    const dir = await gen({ data: "sanity" });
    await expect(stat(path.join(dir, "src/app/studio/[[...tool]]/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/server/db/schema.ts"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.scripts.typegen).toContain("sanity");
    expect(pkg.dependencies["next-sanity"]).toBe("13.3.3");
    const example = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(example).toContain("NEXT_PUBLIC_SANITY_PROJECT_ID");
  });

  test("none has no studio", async () => {
    const dir = await gen({});
    await expect(stat(path.join(dir, "src/app/studio"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
