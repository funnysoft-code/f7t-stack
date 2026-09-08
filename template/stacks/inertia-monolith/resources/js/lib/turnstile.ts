export type TurnstileWidget = {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      size: "compact" | "flexible";
      callback(token: string): void;
      "expired-callback"(): void;
      "error-callback"(): void;
    },
  ): string;
  remove(id: string): void;
};

/** Mount only on forms that use the server's TurnstileToken rule. Load Cloudflare's
 * https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit before calling. */
export function mountTurnstile(
  widget: TurnstileWidget,
  element: HTMLElement,
  siteKey: string,
  production: boolean,
  onToken: (token: string) => void,
): () => void {
  if (!siteKey || (production && /^[123]x0{10,}/.test(siteKey)))
    throw new Error("Configure a real Turnstile site key for production.");
  const id = widget.render(element, {
    sitekey: siteKey,
    size: element.clientWidth < 300 ? "compact" : "flexible",
    callback: onToken,
    "expired-callback": () => onToken(""),
    "error-callback": () => onToken(""),
  });
  return () => {
    widget.remove(id);
    onToken("");
  };
}
