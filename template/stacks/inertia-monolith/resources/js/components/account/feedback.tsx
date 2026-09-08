import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ComponentProps } from "react";

export function Feedback({ message, error = false }: { message?: string; error?: boolean }) {
  if (!message) return null;
  return (
    <Alert
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
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending ? "Working…" : children}
    </Button>
  );
}
