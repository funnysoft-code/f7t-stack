import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("next-intl extra", () => {
  test("intl moves the shell under [locale] and keeps api at root", async () => {
    const dir = await gen({ intl: true, resend: true });
    await expect(stat(path.join(dir, "src/app/[locale]/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/app/page.tsx"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(stat(path.join(dir, "src/app/api/contact/route.ts"))).resolves.toBeTruthy();
    const routing = await readFile(path.join(dir, "src/i18n/routing.ts"), "utf8");
    expect(routing).toContain("localePrefix");
    expect(routing).toContain("as-needed");
    expect(routing).toContain("pt-PT");
  });

  test("intl plus sanity keeps studio unprefixed", async () => {
    const dir = await gen({ intl: true, data: "sanity" });
    await expect(stat(path.join(dir, "src/app/studio/[[...tool]]/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/app/[locale]/studio"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
