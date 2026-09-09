export type Fields = Record<string, string[]>;

export class AccountError extends Error {
  constructor(
    public status: number,
    message = "",
    public fields: Fields = {},
  ) {
    super(message);
  }
}

/** Unwrap the generated client, retaining status before considering the response body. */
export async function request<T>(
  operation: Promise<{ response: Response; data?: T; error?: unknown }>,
): Promise<T> {
  let result;
  try {
    result = await operation;
  } catch {
    throw new AccountError(0);
  }
  if (!result.response.ok) {
    const error = result.error as { message?: string; errors?: Fields } | undefined;
    throw new AccountError(result.response.status, error?.message, error?.errors);
  }
  return result.data as T;
}

export async function confirmed<T>(
  action: () => Promise<T>,
  confirm: () => Promise<void>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (!(error instanceof AccountError) || error.status !== 423) throw error;
    await confirm();
    return action();
  }
}

export function failure(error: unknown): { message: string; fields: Fields } {
  if (error instanceof Error && error.name === "NotSupportedError")
    return {
      message: "This browser does not support passkeys. Use your password or try another browser.",
      fields: {},
    };
  if (error instanceof Error && error.name === "UserCancelledError")
    return {
      message: "Passkey request cancelled. Try again when ready, or use your password.",
      fields: {},
    };
  const messages: Record<number, string> = {
    0: "Could not connect. Check your connection and try again.",
    401: "Your sign-in has expired. Sign in again to continue.",
    403: "This action is not available. Reload the page to check your account status.",
    404: "This page or action is no longer available. Return to sign in or reload the page.",
    419: "This page has expired. Reload it and try again.",
    423: "Confirmation expired. Try the action again to confirm your identity.",
    429: "Too many attempts. Wait a minute before trying again.",
    502: "Account services are unavailable. Try again shortly.",
    503: "Account services are unavailable. Try again shortly.",
  };
  if (error instanceof AccountError)
    return {
      message:
        messages[error.status] ??
        (error.status === 422 && error.message
          ? error.message
          : "Could not complete the request. Try again."),
      fields: error.fields,
    };
  return { message: "Could not complete the request. Try again or use your password.", fields: {} };
}
