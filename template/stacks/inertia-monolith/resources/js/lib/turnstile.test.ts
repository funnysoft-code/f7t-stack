import { expect, test, vi } from "vitest";
import { mountTurnstile, type TurnstileWidget } from "./turnstile";

test("widget forwards tokens, clears expired and failed tokens, and removes itself on cleanup", () => {
  const token = vi.fn();
  const element = {} as HTMLElement;
  const render = vi.fn<TurnstileWidget["render"]>(() => "widget-id");
  const remove = vi.fn();
  const cleanup = mountTurnstile(
    { render, remove },
    element,
    "1x00000000000000000000AA",
    false,
    token,
  );
  const options = render.mock.calls[0]![1];
  expect(options.size).toBe("flexible");
  options.callback("XXXX.DUMMY.TOKEN.XXXX");
  options["expired-callback"]();
  options["error-callback"]();
  cleanup();
  expect(token.mock.calls).toEqual([["XXXX.DUMMY.TOKEN.XXXX"], [""], [""], [""]]);
  expect(remove).toHaveBeenCalledWith("widget-id");
});

test("narrow forms use the compact widget without horizontal overflow", () => {
  const render = vi.fn<TurnstileWidget["render"]>(() => "compact");
  mountTurnstile(
    { render, remove: vi.fn() },
    { clientWidth: 260 } as HTMLElement,
    "local-key",
    false,
    vi.fn(),
  );
  expect(render.mock.calls[0]![1].size).toBe("compact");
});

test.each(["", "1x00000000000000000000AA", "2x00000000000000000000AB", "3x00000000000000000000FF"])(
  "production rejects absent or dummy site key %s",
  (key) => {
    expect(() =>
      mountTurnstile({ render: vi.fn(), remove: vi.fn() }, {} as HTMLElement, key, true, vi.fn()),
    ).toThrow(/real Turnstile/);
  },
);
