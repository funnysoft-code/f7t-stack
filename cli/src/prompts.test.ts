import { describe, expect, test, vi } from "vitest";
import { parseArgv, resolveConfig } from "./config";
import { runWizard } from "./prompts";

const answers = vi.hoisted(() => ({ values: [] as unknown[], messages: [] as string[] }));
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  cancel: vi.fn(),
  isCancel: () => false,
  text: async ({ message }: { message: string }) => {
    answers.messages.push(message);
    return answers.values.shift();
  },
  select: async ({ message }: { message: string }) => {
    answers.messages.push(message);
    return answers.values.shift();
  },
  confirm: async ({ message }: { message: string }) => {
    answers.messages.push(message);
    return answers.values.shift();
  },
}));

describe("wizard parity", () => {
  test.each(["next-only", "inertia-monolith", "api-next"] as const)(
    "%s equals flags",
    async (stack) => {
      answers.messages = [];
      answers.values =
        stack === "next-only"
          ? ["shop", stack, "site", "none", false, false, false, false, "pt-PT", false]
          : ["shop", stack, false];
      const wizard = resolveConfig(await runWizard({}));
      expect(wizard).toEqual(resolveConfig(parseArgv(["shop", "--stack", stack, "--no-git"])));
      expect(answers.values).toEqual([]);
      expect(answers.messages).not.toContain("Harness");
      expect(answers.messages).not.toContain("GitHub Actions");
      if (stack !== "next-only")
        expect(answers.messages).toEqual(["App name", "Stack", "Git init"]);
    },
  );

  test("Drizzle, extras and intl preserve the flag normalization", async () => {
    answers.values = ["app", "drizzle", "postgres", true, true, true, true, false];
    const wizard = await runWizard({ appName: "shop", stack: "next-only" });
    expect(resolveConfig(wizard)).toEqual(
      resolveConfig(
        parseArgv([
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
          "--no-git",
        ]),
      ),
    );
  });

  test("invalid supplied choices fail before prompting", async () => {
    answers.messages = [];
    await expect(runWizard({ stack: "api-next", data: "none" })).rejects.toThrow(/Next-only/);
    expect(answers.messages).toEqual([]);
  });
});
