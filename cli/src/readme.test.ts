import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("README names invoke, flags, and out of scope", async () => {
  const readme = await readFile("README.md", "utf8");
  expect(readme).toContain("bunx create-f7t-app@latest");
  expect(readme).toContain("--data");
  expect(readme).toContain("tRPC");
  expect(readme).toContain("Laravel");
});
