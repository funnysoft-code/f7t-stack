import { describe, expect, test, vi } from "vitest";
import { resolveConfig } from "./config";
import { logNextSteps } from "./next-steps";

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
});
