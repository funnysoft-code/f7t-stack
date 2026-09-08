import { useEffect, useRef, useState } from "react";
import { mountTurnstile, type TurnstileWidget } from "@/lib/turnstile";
import { Button } from "@/components/ui/button";

let loading: Promise<TurnstileWidget> | undefined;
function loadWidget(): Promise<TurnstileWidget> {
  const target = window as Window & { turnstile?: TurnstileWidget };
  if (target.turnstile) return Promise.resolve(target.turnstile);
  loading ??= new Promise<TurnstileWidget>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () =>
      target.turnstile
        ? resolve(target.turnstile)
        : reject(new Error("Security check unavailable."));
    script.onerror = () => {
      script.remove();
      reject(new Error("Security check unavailable."));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

export function TurnstileCheck({
  attempt,
  ready,
  onToken,
}: {
  attempt: number;
  ready: boolean;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let remove: (() => void) | undefined;
    void loadWidget()
      .then((widget) => {
        if (active && container.current) {
          remove = mountTurnstile(
            widget,
            container.current,
            import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "",
            import.meta.env.PROD,
            onToken,
          );
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      remove?.();
    };
  }, [attempt, retry, onToken]);
  return (
    <div>
      <div ref={container} aria-label="Security check" />
      {failed ? (
        <div role="alert">
          <p>Security check unavailable.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFailed(false);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {ready ? "Security check complete." : "Complete the security check before submitting."}
        </p>
      )}
    </div>
  );
}
