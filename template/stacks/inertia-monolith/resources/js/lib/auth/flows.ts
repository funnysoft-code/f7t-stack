export type Endpoint = { url: string; method: string };
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

/** JSON mutations must never carry the Inertia navigation header. */
export async function request<T = null>(endpoint: Endpoint, body?: unknown): Promise<T> {
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  let response: Response;
  try {
    response = await fetch(endpoint.url, {
      method: endpoint.method.toUpperCase(),
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": decodeURIComponent(csrf?.slice(11) ?? ""),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new AccountError(0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new AccountError(response.status, data?.message, data?.errors);
  }
  return (await response.json().catch(() => null)) as T;
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
  const messages: Record<number, string> = {
    0: "Could not connect. Check your connection and try again.",
    401: "Your sign-in has expired. Sign in again to continue.",
    403: "This action is not available. Reload the page to check your account status.",
    404: "This page or action is no longer available. Return to sign in or reload the page.",
    419: "This page has expired. Reload it and try again.",
    423: "Confirmation expired. Try the action again to confirm your identity.",
    429: "Too many attempts. Wait a minute before trying again.",
  };
  if (error instanceof AccountError)
    return {
      message:
        messages[error.status] ??
        (error.status === 422 ? error.message : "Could not complete the request. Try again."),
      fields: error.fields,
    };
  return { message: "Could not complete the request. Try again or use your password.", fields: {} };
}

export function localDestination(path?: string): string {
  if (!path) return "/";
  try {
    const decoded = decodeURIComponent(path);
    if (
      !decoded.startsWith("/") ||
      decoded.startsWith("//") ||
      /[\\\s]/.test(decoded) ||
      decoded.includes("//")
    )
      return "/";
    return path;
  } catch {
    return "/";
  }
}
