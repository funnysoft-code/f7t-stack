"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SafeForm } from "@/components/account/safe-form";
import type { Passkey } from "@f7t/api-client";
import { Shell } from "@/components/account/shell";
import { useConfirmed } from "@/components/account/confirmation";
import { useOperation } from "@/components/account/use-operation";
import { InputField } from "@/components/account/input-field";
import { Feedback, Submit } from "@/components/account/feedback";
import { DestructiveAction } from "@/components/account/destructive-action";
import { FieldGroup } from "@/components/ui/field";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { AccountError, request, failure } from "@/lib/auth/flows";
import { browserApi } from "@/lib/api/browser";
import type { AccountProps } from "@/types/account";

function PasskeysForm() {
  const [keys, setKeys] = useState<Passkey[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const loadGeneration = useRef(0);
  const operation = useOperation();
  const confirmed = useConfirmed();
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    try {
      const result = await request(browserApi.GET("/auth/user/passkeys"));
      if (generation !== loadGeneration.current) return;
      setKeys(result.data);
      setLoadError("");
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      setLoadError(failure(error).message);
      throw error;
    }
  }, []);
  useEffect(() => {
    // The loader owns feedback; initial reads have no mutation operation to report to.
    void load().catch(() => {});
    return () => {
      loadGeneration.current++;
    };
  }, [load]);
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>Your passkeys</h2>
        </CardTitle>
        <CardDescription>
          Use your fingerprint, face, or device PIN. Give each passkey a name you will recognize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Feedback error message={loadError || operation.error} />
          <Feedback message={operation.success} />
          {loadError ? (
            <Button variant="outline" onClick={() => void operation.run(load)}>
              Retry loading passkeys
            </Button>
          ) : keys === null ? (
            <Skeleton className="h-24 w-full" aria-label="Loading passkeys" />
          ) : keys.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No passkeys yet</EmptyTitle>
                <EmptyDescription>
                  Add a passkey on this device. Your password will still work.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            keys.map((key) => (
              <Item key={key.uuid} variant="outline">
                <ItemContent>
                  <ItemTitle>{key.name}</ItemTitle>
                  <ItemDescription>
                    {key.last_used_at
                      ? `Last used ${key.last_used_at.slice(0, 10)}`
                      : "Not used to sign in yet"}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DestructiveAction
                    label={`Remove ${key.name}`}
                    description="This passkey will no longer sign you in. Your password and other passkeys will still work."
                    disabled={operation.pending}
                    onConfirm={() =>
                      void operation.run(async () => {
                        await confirmed(() =>
                          request(
                            browserApi.DELETE("/auth/user/passkeys/{passkey}", {
                              params: { path: { passkey: key.uuid } },
                            }),
                          ),
                        );
                        await load();
                      }, "Passkey removed.")
                    }
                  />
                </ItemActions>
              </Item>
            ))
          )}
          <SafeForm
            id="passkey-form"
            onSubmit={(event) => {
              // eslint-disable-next-line react-doctor/no-prevent-default -- WebAuthn is a browser ceremony followed by a Laravel JSON mutation.
              event.preventDefault();
              const form = event.currentTarget;
              const name = String(new FormData(form).get("name"));
              void operation.run(async () => {
                const { registerPasskey } = await import("@/lib/api/passkeys");
                await confirmed(async () => {
                  const status = await request(browserApi.GET("/auth/confirmed-password-status"));
                  if (!status.confirmed) throw new AccountError(423);
                  const listing = await registerPasskey(name);
                  return request(Promise.resolve(listing));
                });
                form.reset();
                await load();
              }, "Passkey added. You can use it the next time you sign in.");
            }}
          >
            <InputField
              label="Passkey name"
              name="name"
              autoComplete="off"
              required
              maxLength={255}
              placeholder="For example, personal laptop"
              error={operation.fields.name}
            />
          </SafeForm>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Submit form="passkey-form" pending={operation.pending}>
          Add a passkey
        </Submit>
      </CardFooter>
    </Card>
  );
}
export default function PasskeysPage({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Passkeys"
      description="A secure sign-in, without typing a password."
    >
      <PasskeysForm />
    </Shell>
  );
}
