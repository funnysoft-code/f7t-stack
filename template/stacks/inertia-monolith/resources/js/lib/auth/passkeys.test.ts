import { expect, it } from "vitest";
import { NotSupportedError, UserCancelledError } from "@laravel/passkeys";
import { ceremony } from "./passkeys";

it("preserves success and maps package failures without leaking credentials", async () => {
  expect(await ceremony(async () => "registered")).toBe("registered");
  for (const [error, status, message] of [
    [new NotSupportedError(), 422, "not supported"],
    [new UserCancelledError(), 422, "cancelled"],
    [new Error("Password confirmation required."), 423, ""],
    [new Error("private payload"), 422, "could not be verified"],
    [null, 422, "could not be verified"],
  ] as const) {
    await expect(
      ceremony(async () => {
        throw error;
      }),
    ).rejects.toMatchObject({ status, message: expect.stringContaining(message) });
  }
});
