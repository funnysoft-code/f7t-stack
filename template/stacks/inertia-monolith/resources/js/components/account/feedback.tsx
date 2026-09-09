import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { useHydrated } from "./safe-form";

export function Feedback({ message, error = false }: { message?: string; error?: boolean }) {
  const node = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (error && message) node.current?.focus();
  }, [error, message]);
  if (!message) return null;
  return (
    <Alert
      ref={node}
      variant={error ? "destructive" : "default"}
      role={error ? "alert" : "status"}
      tabIndex={-1}
      data-feedback
    >
      <AlertTitle>{error ? "Check and try again" : "Account update"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function Submit({
  pending,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) {
  const hydrated = useHydrated();
  return (
    <Button
      type="submit"
      aria-busy={pending}
      {...props}
      disabled={!hydrated || pending || disabled}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending ? "Working…" : children}
    </Button>
  );
}
