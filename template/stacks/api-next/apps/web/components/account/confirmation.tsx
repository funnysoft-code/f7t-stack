"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { SafeForm } from "./safe-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { InputField } from "./input-field";
import { Feedback, Submit } from "./feedback";
import { useOperation } from "./use-operation";
import { AccountError, confirmed, request } from "@/lib/auth/flows";
import { browserApi } from "@/lib/api/browser";

const ConfirmationContext = createContext<(() => Promise<void>) | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const resolver = useRef<{
    resolve: () => void;
    reject: (error: unknown) => void;
    trigger: HTMLElement | null;
  } | null>(null);
  const operation = useOperation();
  function finish(cancelled = false) {
    const current = resolver.current;
    resolver.current = null;
    setOpen(false);
    setPassword("");
    if (cancelled)
      current?.reject(
        new AccountError(422, "Confirmation cancelled. Your changes have not been submitted."),
      );
    else current?.resolve();
    requestAnimationFrame(() => current?.trigger?.focus());
  }
  const ask = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      resolver.current = {
        resolve,
        reject,
        trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      };
      setOpen(true);
    });
  }, []);
  return (
    <ConfirmationContext.Provider value={ask}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value && !operation.pending) finish(true);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => {
            if (operation.pending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirm it's you</DialogTitle>
            <DialogDescription>
              Use your password or an enrolled passkey. Then we will continue your account change.
            </DialogDescription>
          </DialogHeader>
          <Feedback error message={operation.error} />
          <SafeForm
            onSubmit={(event) => {
              // eslint-disable-next-line react-doctor/no-prevent-default -- Laravel JSON mutations must relay cookies through the browser proxy.
              event.preventDefault();
              void operation.run(async () => {
                await request(browserApi.POST("/auth/confirm-password", { body: { password } }));
                finish();
              });
            }}
          >
            <FieldGroup>
              <InputField
                label="Current password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={operation.fields.password}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={operation.pending}
                  onClick={() => finish(true)}
                >
                  Cancel
                </Button>
                <Submit pending={operation.pending}>Confirm and continue</Submit>
              </DialogFooter>
            </FieldGroup>
          </SafeForm>
          <Button
            variant="outline"
            disabled={operation.pending}
            onClick={() =>
              void operation.run(async () => {
                const [{ Passkeys }, { passkeyRoutes }] = await Promise.all([
                  import("@laravel/passkeys"),
                  import("@/lib/api/passkeys"),
                ]);
                await Passkeys.verify({ routes: passkeyRoutes.confirmation });
                finish();
              })
            }
          >
            Confirm with a passkey
          </Button>
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmed() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error("ConfirmationProvider is required.");
  return <T,>(action: () => Promise<T>) => confirmed(action, confirm);
}
