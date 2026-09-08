import { afterEach, describe, expect, test, vi } from "vitest";
import { installDeps } from "./install";

afterEach(() => vi.unstubAllGlobals());

describe("dependency installation", () => {
  test("uses the frozen release lock and keeps subprocess output out of results", async () => {
    const spawn = vi.fn(() => ({ exited: Promise.resolve(0) }));
    vi.stubGlobal("Bun", { spawn });
    await installDeps("/fixture/project");
    expect(spawn).toHaveBeenCalledWith(["bun", "install", "--frozen-lockfile"], {
      cwd: "/fixture/project",
      stdout: "ignore",
      stderr: "ignore",
    });
  });

  test("a nonzero installation cannot resolve successfully", async () => {
    vi.stubGlobal("Bun", { spawn: () => ({ exited: Promise.resolve(1) }) });
    await expect(installDeps("/fixture/project")).rejects.toThrow(/exited with code 1/);
  });
});
