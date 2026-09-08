import { afterEach, describe, expect, test, vi } from "vitest";
import { installDeps } from "./install";

afterEach(() => vi.unstubAllGlobals());

describe("dependency installation", () => {
  test("uses the frozen release lock and keeps subprocess output out of results", async () => {
    vi.stubGlobal("Bun", { spawn: () => ({ exited: Promise.resolve(0) }) });
    const run = vi.fn(async () => "private output");
    expect(await installDeps("/fixture/project", run)).toBeUndefined();
    expect(run).toHaveBeenCalledWith(["bun", "install", "--frozen-lockfile"], "/fixture/project");
  });

  test("a nonzero installation cannot resolve successfully", async () => {
    vi.stubGlobal("Bun", { spawn: () => ({ exited: Promise.resolve(0) }) });
    const run = vi.fn(async () => {
      throw new Error("Command failed");
    });
    await expect(installDeps("/fixture/project", run)).rejects.toThrow(/Command failed/);
  });
});
