import { describe, expect, test, vi } from "vitest";
import { runCli } from "./index";
import { GenerationError, type GenerationResult } from "./create-app";

const pending: GenerationResult = {
  status: "setup-pending",
  stack: "next-only",
  failedStage: null,
  pendingSteps: ["dependencies", "local-setup", "verification"],
  recovery: "Setup runner pending U12",
  message: "Files generated. Setup pending.",
};

describe("unattended CLI", () => {
  test.each([[], ["--yes"], ["--CI"], ["--json"]])(
    "missing app name with %j never prompts or generates",
    async (...flags) => {
      const wizard = vi.fn();
      const generate = vi.fn();
      const output = vi.fn();
      expect(await runCli(flags, { isTTY: false, wizard, generate, output })).toBe(1);
      expect(wizard).not.toHaveBeenCalled();
      expect(generate).not.toHaveBeenCalled();
      expect(output.mock.calls[0]![0]).toContain("--app-name");
    },
  );

  test.each(["next-only", "inertia-monolith", "api-next"] as const)(
    "%s generates deterministically without a TTY",
    async (stack) => {
      const wizard = vi.fn();
      const output = vi.fn();
      const generate = vi.fn(async (_config: import("./config").CreateConfig) => ({
        ...pending,
        stack,
      }));
      expect(
        await runCli(["shop", "--stack", stack, "--no-git", "--skip-install"], {
          isTTY: false,
          wizard,
          generate,
          output,
        }),
      ).toBe(0);
      expect(wizard).not.toHaveBeenCalled();
      expect(generate.mock.calls[0]?.[0]).toMatchObject({ stack, git: false, skipInstall: true });
    },
  );

  test("JSON suppresses wizard even with a TTY and prints one structured result", async () => {
    const wizard = vi.fn();
    const output = vi.fn();
    expect(
      await runCli(["shop", "--json"], {
        isTTY: true,
        wizard,
        generate: async () => pending,
        output,
      }),
    ).toBe(0);
    expect(wizard).not.toHaveBeenCalled();
    expect(output).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0]![0])).toEqual(pending);
  });

  test.each([
    ["shop", "--stack", "wrong"],
    ["shop", "--stack", "api-next", "--resend"],
    ["shop", "--git", "--no-git"],
    ["shop", "--no-github-actions"],
    ["shop", "--harness", "both"],
    ["../escape"],
    ["shop", "--license-key", "secret-value"],
  ])("invalid args %j never call generation", async (...args) => {
    const output = vi.fn();
    const generate = vi.fn();
    expect(await runCli([...args, "--json"], { isTTY: false, output, generate })).toBe(1);
    expect(generate).not.toHaveBeenCalled();
    expect(output.mock.calls[0]![0]).not.toContain("secret-value");
    expect(JSON.parse(output.mock.calls[0]![0])).toMatchObject({
      status: "incomplete",
      failedStage: "validation",
    });
  });

  test("failed dependency stage prints no success next steps and returns nonzero", async () => {
    const result: GenerationResult = {
      ...pending,
      status: "incomplete",
      failedStage: "dependencies",
      message: "Dependency installation failed.",
    };
    const output = vi.fn();
    const generate = async () => {
      throw new GenerationError(result);
    };
    expect(await runCli(["shop", "--yes"], { output, generate })).toBe(1);
    expect(output).toHaveBeenCalledTimes(1);
    expect(output.mock.calls[0]![0]).toContain("Failed stage: dependencies");
    expect(output.mock.calls[0]![0]).not.toContain("bun run dev");
  });

  test("help documents breaking policy and force changes", async () => {
    const output = vi.fn();
    const generate = vi.fn();
    expect(await runCli(["--help"], { output, generate })).toBe(0);
    expect(output.mock.calls[0]![0]).toContain("mandatory");
    expect(output.mock.calls[0]![0]).toContain("--force");
    expect(generate).not.toHaveBeenCalled();
  });
});
