import { expect, test } from "vitest";
import { dependencyMatrix, generationMatrix, verifyCompleteCatalog } from "./release-matrix";
import type { ReleaseManifest } from "./standards";

test("matrix covers 192 Next configurations, 64 Next dependency graphs and both Laravel stacks", () => {
  expect(generationMatrix()).toHaveLength(194);
  expect(dependencyMatrix()).toHaveLength(66);
  expect(new Set(dependencyMatrix().map(({ key }) => key)).size).toBe(66);
  expect(
    dependencyMatrix()
      .filter(({ flags }) => flags.stack !== "next-only")
      .map(({ flags }) => flags.stack),
  ).toEqual(["inertia-monolith", "api-next"]);
});

test("release catalog rejects missing or extra supported compositions", () => {
  const release = { locks: dependencyMatrix().map(({ key }) => ({ key })) } as ReleaseManifest;
  expect(() => verifyCompleteCatalog(release)).not.toThrow();
  release.locks.pop();
  expect(() => verifyCompleteCatalog(release)).toThrow("Incomplete supported composition catalog");
});
