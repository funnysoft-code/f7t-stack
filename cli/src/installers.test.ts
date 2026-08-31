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

  test("drizzle postgres + app + both harness", () => {
    expect(
      names({
        data: "drizzle",
        db: "postgres",
        shell: "app",
        harness: "both",
        githubActions: false,
      }),
    ).toEqual(["drizzle-postgres", "shell-app", "harness-grok", "harness-cursor"]);
  });

  test("sanity and drizzle are mutually exclusive gates", () => {
    expect(names({ data: "sanity", githubActions: false })).toEqual(["sanity", "shell-site"]);
    expect(names({ data: "drizzle", githubActions: false })).toEqual([
      "drizzle-sqlite",
      "shell-site",
    ]);
  });
});
