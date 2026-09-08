import { describe, expect, test, vi } from "vitest";
import { resolveConfig } from "./config";
import { formatResult, logNextSteps } from "./next-steps";
import type { GenerationResult } from "./create-app";

function captureStdout(fn: () => void): string {
  const chunks: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    chunks.push(args.map(String).join(" "));
  });
  try {
    fn();
    return chunks.join("\n");
  } finally {
    spy.mockRestore();
  }
}

describe("logNextSteps", () => {
  test("drizzle postgres includes docker compose up", () => {
    const config = resolveConfig(
      { appName: "shop", yes: true, data: "drizzle", db: "postgres" },
      "/tmp",
    );
    expect(captureStdout(() => logNextSteps(config))).toContain("docker compose up");
  });

  test("playwright includes playwright install", () => {
    const config = resolveConfig({ appName: "shop", yes: true, playwright: true }, "/tmp");
    expect(captureStdout(() => logNextSteps(config))).toContain("playwright install");
  });

  test("sanity includes typegen", () => {
    const config = resolveConfig({ appName: "shop", yes: true, data: "sanity" }, "/tmp");
    expect(captureStdout(() => logNextSteps(config))).toContain("typegen");
  });

  test("--yes site/none includes bun run dev and bun run check", () => {
    const config = resolveConfig({ appName: "shop", yes: true }, "/tmp");
    const out = captureStdout(() => logNextSteps(config));
    expect(out).toContain("bun run dev");
    expect(out).toContain("bun run check");
  });

  test.each(["inertia-monolith", "api-next"] as const)(
    "%s reports Laravel setup and no Next data commands",
    (stack) => {
      const config = resolveConfig({ appName: "shop", stack, skipInstall: true });
      const out = captureStdout(() => logNextSteps(config));
      expect(out).toContain("PostgreSQL, Redis and local mail");
      expect(out).not.toContain("db:migrate");
      expect(out).not.toContain("typegen");
      if (stack === "api-next") {
        expect(out).toContain("apps/web");
        expect(out).toContain("services/api");
      }
    },
  );

  test("human output carries the same fields as structured results", () => {
    const result: GenerationResult = {
      status: "incomplete",
      stack: "api-next",
      failedStage: "dependencies",
      pendingSteps: ["dependencies", "local-setup"],
      recovery: "bun run setup",
      message: "Installation failed.",
    };
    const out = formatResult(result);
    for (const value of [
      result.status,
      result.stack,
      result.failedStage,
      result.recovery,
      result.message,
      ...result.pendingSteps,
    ])
      expect(out).toContain(value);
    expect(captureStdout(() => logNextSteps(resolveConfig({ appName: "shop" }), result))).toBe("");
  });
});
