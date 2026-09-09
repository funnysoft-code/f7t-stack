import { expect, test } from "vitest";
import { site } from "./site";

test("shell configuration has resolved identity and safe, unique local navigation", () => {
  expect(site.name.trim()).not.toBe("");
  expect(site.name).not.toContain("__F7T_");
  expect(Intl.getCanonicalLocales(site.locale)).toHaveLength(1);
  expect(site.nav.length).toBeGreaterThan(0);
  const paths = site.nav.map(({ href, label }) => {
    expect(label.trim()).not.toBe("");
    const target = new URL(href, "https://app.example.test");
    expect(target.origin).toBe("https://app.example.test");
    return target.pathname;
  });
  expect(new Set(paths).size).toBe(paths.length);
});
