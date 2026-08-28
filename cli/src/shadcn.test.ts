import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("shadcn extra", () => {
  test("shadcn extra vendors button and not radix", async () => {
    const dir = await gen({ shadcn: true });
    const button = await readFile(path.join(dir, "src/components/ui/button.tsx"), "utf8");
    expect(button).toContain("@base-ui/react");
    expect(button).not.toContain("@radix-ui");
    const json = JSON.parse(await readFile(path.join(dir, "components.json"), "utf8"));
    expect(json.aliases.utils).toContain("~/lib/utils");
  });

  test("off means no components.json", async () => {
    const dir = await gen({});
    await expect(stat(path.join(dir, "components.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
