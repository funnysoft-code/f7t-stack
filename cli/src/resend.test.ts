import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { gen, trackTempDirs } from "./test-helpers";

trackTempDirs();

describe("resend extra", () => {
  test("pt-PT without intl uses /contacto", async () => {
    const dir = await gen({ resend: true, locale: "pt-PT" });
    await expect(stat(path.join(dir, "src/app/contacto/page.tsx"))).resolves.toBeTruthy();
    await expect(stat(path.join(dir, "src/app/contact/page.tsx"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const route = await readFile(path.join(dir, "src/app/api/contact/route.ts"), "utf8");
    expect(route).toContain("Resend");
    expect(route).not.toContain("@trpc");
    expect(route).not.toContain("drizzle");
    expect(route).toContain("503");
    expect(route).not.toContain("console.log");
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    expect(pkg.dependencies.resend).toBe("6.24.0");
    const example = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(example).toContain("RESEND_API_KEY=");
    expect(example).toContain("CONTACT_TO_EMAIL=");
  });

  test("en uses /contact", async () => {
    const dir = await gen({ resend: true, locale: "en" });
    await expect(stat(path.join(dir, "src/app/contact/page.tsx"))).resolves.toBeTruthy();
    const page = await readFile(path.join(dir, "src/app/contact/page.tsx"), "utf8");
    expect(page).toContain("use client");
    expect(page).toContain("/api/contact");
    expect(page).not.toContain("next-intl");
    expect(page).toContain("Contact");
  });
});
