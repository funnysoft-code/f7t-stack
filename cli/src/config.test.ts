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
      "opencode",
      "--github-actions",
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
    expect(input.harness).toBe("opencode");
    expect(input.githubActions).toBe(true);
    expect(input.git).toBe(false);
    expect(input.skipInstall).toBe(true);
    expect(input.force).toBe(true);
  });

  test("--CI is --yes", () => {
    expect(parseArgv(["--CI"]).yes).toBe(true);
    expect(parseArgv(["--CI"]).ci).toBe(true);
  });

  test("conflicting app names fail", () => {
    expect(() => parseArgv(["ignored", "--app-name", "real"])).toThrow(/Conflicting/);
  });

  test("--git and --github-actions are presence flags", () => {
    const input = parseArgv(["--git", "--github-actions"]);
    expect(input.git).toBe(true);
    expect(input.githubActions).toBe(true);
  });

  test("conflicting and repeated flags fail", () => {
    for (const args of [
      ["--git", "--no-git"],
      ["--stack", "next-only", "--stack", "api-next"],
    ])
      expect(() => parseArgv(args)).toThrow(/conflicting/);
  });
});

describe("resolveConfig", () => {
  test("explicit Laravel stacks reject Next data flags", () => {
    expect(() =>
      resolveConfig(parseArgv(["shop", "--stack", "api-next", "--data", "none"])),
    ).toThrow(/Next-only/);
  });
  test("omitted stack normalizes to Next with mandatory OpenCode", () => {
    expect(resolveConfig({ appName: "shop" })).toMatchObject({
      stack: "next-only",
      harness: "opencode",
    });
  });
  test("policy-off flags explain the replacement", () => {
    expect(() => parseArgv(["shop", "--no-github-actions"])).toThrow(/mandatory/);
  });
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
      stack: "next-only",
      harness: "opencode",
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

  test.each(["inertia-monolith", "api-next"] as const)(
    "%s has a fixed Laravel baseline",
    (stack) => {
      const config = resolveConfig(
        parseArgv(["shop", "--stack", stack, "--CI", "--no-git", "--skip-install"]),
      );
      expect(config).toMatchObject({
        stack,
        shell: "app",
        locale: "en",
        db: "postgres",
        resend: true,
        shadcn: true,
        playwright: true,
        harness: "opencode",
        githubActions: true,
        git: false,
        skipInstall: true,
      });
      expect(config).not.toHaveProperty("data");
    },
  );

  test.each(["inertia-monolith", "api-next"] as const)(
    "%s rejects every Next-only input",
    (stack) => {
      for (const flags of [
        ["--data", "none"],
        ["--data", "sanity"],
        ["--data", "drizzle"],
        ["--db", "sqlite"],
        ["--db", "postgres"],
        ["--shell", "app"],
        ["--shell", "site"],
        ["--intl"],
        ["--locale", "en"],
        ["--locale", "pt-PT"],
        ["--resend"],
      ])
        expect(() => resolveConfig(parseArgv(["shop", "--stack", stack, ...flags]))).toThrow(
          /Next-only/,
        );
    },
  );

  test.each(["none", "grok", "cursor", "both"])(
    "rejects obsolete harness %s with migration guidance",
    (harness) => {
      expect(() => parseArgv(["shop", "--harness", harness])).toThrow(/--harness opencode/);
    },
  );

  test.each(["", "../outside", ".", "/absolute", "two words", "UPPER", "-flag", "a/b"])(
    "rejects unsafe app name %j",
    (appName) => {
      expect(() => resolveConfig({ appName })).toThrow(/App name/);
    },
  );

  test("invalid enum, extra positional and missing flag values fail deterministically", () => {
    for (const flags of [
      ["--stack", "wrong"],
      ["--stack"],
      ["--data", "wrong"],
      ["a", "b"],
      ["--secret", "do-not-print"],
    ])
      expect(() => parseArgv(flags)).toThrow();
  });
});
