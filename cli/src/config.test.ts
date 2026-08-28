import { describe, expect, test } from "vitest";
import { parseArgv, resolveConfig } from "./config";

describe("parseArgv", () => {
  test("reads positional name and long flags", () => {
    const input = parseArgv([
      "shop",
      "--shell",
      "app",
      "--data",
      "drizzle",
      "--db",
      "postgres",
      "--shadcn",
      "--playwright",
      "--resend",
      "--intl",
      "--harness",
      "both",
      "--no-github-actions",
      "--no-git",
      "--skip-install",
      "--force",
    ]);
    expect(input.appName).toBe("shop");
    expect(input.shell).toBe("app");
    expect(input.data).toBe("drizzle");
    expect(input.db).toBe("postgres");
    expect(input.shadcn).toBe(true);
    expect(input.playwright).toBe(true);
    expect(input.resend).toBe(true);
    expect(input.intl).toBe(true);
    expect(input.harness).toBe("both");
    expect(input.githubActions).toBe(false);
    expect(input.git).toBe(false);
    expect(input.skipInstall).toBe(true);
    expect(input.force).toBe(true);
  });

  test("--CI is --yes", () => {
    expect(parseArgv(["--CI"]).yes).toBe(true);
    expect(parseArgv(["--CI"]).ci).toBe(true);
  });

  test("--app-name wins over positional", () => {
    expect(parseArgv(["ignored", "--app-name", "real"]).appName).toBe("real");
  });

  test("--git and --github-actions are presence flags", () => {
    const input = parseArgv(["--git", "--github-actions"]);
    expect(input.git).toBe(true);
    expect(input.githubActions).toBe(true);
  });

  test("later git and github-actions flags win", () => {
    expect(parseArgv(["--git", "--no-git"]).git).toBe(false);
    expect(parseArgv(["--no-git", "--git"]).git).toBe(true);
    expect(parseArgv(["--github-actions", "--no-github-actions"]).githubActions).toBe(false);
    expect(parseArgv(["--no-github-actions", "--github-actions"]).githubActions).toBe(true);
  });
});

describe("resolveConfig", () => {
  test("--yes fills spec defaults", () => {
    const config = resolveConfig({ appName: "acme", yes: true }, "/tmp");
    expect(config).toMatchObject({
      appName: "acme",
      projectDir: "/tmp/acme",
      shell: "site",
      data: "none",
      db: "sqlite",
      shadcn: false,
      playwright: false,
      resend: false,
      intl: false,
      locale: "pt-PT",
      harness: "none",
      githubActions: true,
      git: true,
      skipInstall: false,
      force: false,
    });
  });

  test("drizzle without db is sqlite", () => {
    const config = resolveConfig({ appName: "acme", yes: true, data: "drizzle" }, "/tmp");
    expect(config.db).toBe("sqlite");
  });

  test("intl ignores --locale and uses en", () => {
    const config = resolveConfig(
      { appName: "acme", yes: true, intl: true, locale: "pt-PT" },
      "/tmp",
    );
    expect(config.intl).toBe(true);
    expect(config.locale).toBe("en");
  });

  test("--yes without appName throws", () => {
    expect(() => resolveConfig({ yes: true }, "/tmp")).toThrow(/--app-name/);
  });
});
