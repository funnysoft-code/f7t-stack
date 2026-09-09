"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

/** Account mutations require the hydrated handler and its CSRF transport. */
export function SafeForm({
  children,
  ...props
}: Omit<ComponentProps<"form">, "method" | "action">) {
  const hydrated = useHydrated();
  return (
    <form {...props} method="post">
      <noscript>Enable JavaScript and reload this page to use this form.</noscript>
      <fieldset disabled={!hydrated} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
