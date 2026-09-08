import { describe, expect, test } from "vitest";
import { resolveConfig } from "./config";
import { installers } from "./installers";

const names = (input: Parameters<typeof resolveConfig>[0]) =>
  installers
    .filter((installer) =>
      installer.shouldRun(
        resolveConfig({ appName: "x", yes: true, skipInstall: true, ...input }, "/tmp"),
      ),
    )
    .map((installer) => installer.name);

describe("installer order and gates", () => {
  test("--yes runs shell-site and github-actions only", () => {
    expect(names({})).toEqual(["shell-site", "github-actions"]);
  });

  test("drizzle postgres + app retains mandatory quality workflow", () => {
    expect(
      names({
        data: "drizzle",
        db: "postgres",
        shell: "app",
        harness: "opencode",
      }),
    ).toEqual(["drizzle-postgres", "shell-app", "github-actions"]);
  });

  test("sanity and drizzle are mutually exclusive gates", () => {
    expect(names({ data: "sanity" })).toEqual(["sanity", "shell-site", "github-actions"]);
    expect(names({ data: "drizzle" })).toEqual(["drizzle-sqlite", "shell-site", "github-actions"]);
  });
});
