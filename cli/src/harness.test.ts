import { stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("harness extras", () => {
  test("OpenCode selection never writes obsolete harness trees", async () => {
    const dir = await gen({ harness: "opencode" });
    await expect(stat(path.join(dir, ".grok"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(path.join(dir, ".cursor"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("old harness selections fail with migration guidance", async () => {
    await expect(gen({ harness: "both" })).rejects.toThrow(/--harness opencode/);
  });
});
