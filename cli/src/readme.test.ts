import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("README documents all stacks, setup recovery and the pending release gate", async () => {
  const readme = await readFile("README.md", "utf8");
  expect(readme).toContain("bunx create-f7t-app my-app");
  for (const stack of ["next-only", "inertia-monolith", "api-next"])
    expect(readme).toContain(`--stack ${stack}`);
  expect(readme).toContain("--data");
  expect(readme).toContain("bun run setup");
  expect(readme).toContain("verify:release");
  expect(readme).toContain("0.2.0 is not released");
  expect(readme).toContain("v0.3.3");
  expect(readme).toContain("cannot overwrite a nonempty target");
});
