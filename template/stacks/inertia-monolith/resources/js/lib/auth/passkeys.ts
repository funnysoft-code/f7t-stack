import { Passkeys, NotSupportedError, UserCancelledError } from "@laravel/passkeys";
import { AccountError } from "./flows";

export async function ceremony<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof NotSupportedError)
      throw new AccountError(
        422,
        "Passkeys are not supported in this browser. Use your password instead.",
      );
    if (error instanceof UserCancelledError)
      throw new AccountError(422, "Passkey request cancelled. Try again or use your password.");
    // 0.4.0 preserves the server message but discards the HTTP status.
    if (error instanceof Error && error.message === "Password confirmation required.")
      throw new AccountError(423);
    throw new AccountError(
      422,
      "The passkey could not be verified. Start again or use your password.",
    );
  }
}

export { Passkeys };
