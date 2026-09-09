import { describe, expect, test, vi } from "vitest";
import { checkPrerequisites, runCommand } from "./prerequisites";

describe("setup prerequisites", () => {
  test.each(["php", "herd"])(
    "missing %s extensions names required extensions and stops setup",
    async (tool) => {
      const run = (command: string[], cwd: string) =>
        command[0] === tool && command.join(" ").includes("extension_loaded")
          ? runCommand([process.execPath, "-e", "process.exit(1)"], cwd)
          : Promise.resolve(
              command[0] === "bun"
                ? "1.4.0"
                : command[0] === "composer"
                  ? "Composer version 2.9.0"
                  : "80500",
            );
      await expect(checkPrerequisites("api-next", process.cwd(), run)).rejects.toThrow(
        /pdo_pgsql, redis/,
      );
    },
  );
  test("Next requires Bun without imposing PHP or Herd", async () => {
    const run = vi.fn(async () => "1.4.0");
    await checkPrerequisites("next-only", "/project", run);
    expect(run.mock.calls).toHaveLength(1);
  });
  test.each(["bun", "composer", "php", "herd"])(
    "reports missing %s without leaking command output",
    async (tool) => {
      const run = async (command: string[]) => {
        if (command[0] === tool) throw new Error("secret");
        return command[0] === "bun"
          ? "1.4.0"
          : command[0] === "composer"
            ? "Composer version 2.9.0"
            : "80500";
      };
      await expect(checkPrerequisites("api-next", "/project", run)).rejects.toThrow(tool);
      await expect(checkPrerequisites("api-next", "/project", run)).rejects.not.toThrow("secret");
    },
  );
  test("rejects old CLI or site PHP", async () => {
    for (const old of ["php", "herd"]) {
      const run = async (command: string[]) =>
        command[0] === "bun"
          ? "1.4.0"
          : command[0] === "composer"
            ? "Composer version 2.9.0"
            : command[0] === old
              ? "80400"
              : "80500";
      await expect(checkPrerequisites("inertia-monolith", "/project", run)).rejects.toThrow(/8.5/);
    }
  });
});
