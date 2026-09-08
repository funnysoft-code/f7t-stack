import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
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
import { index, destroy, registrationOptions, store } from "@/routes/passkey";
import { confirmation } from "@/routes/password";
import type { AccountProps } from "@/types/account";

function PasskeysForm() {
  const [keys, setKeys] = useState<App.Data.Users.PasskeyData[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const operation = useOperation();
  const confirmed = useConfirmed();
  async function load() {
    const result = await request<{ data: App.Data.Users.PasskeyData[] }>(index());
    setKeys(result.data);
    setLoadError("");
  }
  useEffect(() => {
    let active = true;
    void request<{ data: App.Data.Users.PasskeyData[] }>(index())
      .then((result) => {
        if (active) setKeys(result.data);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(failure(error).message);
      });
    return () => {
      active = false;
    };
  }, []);
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
              <Item key={key.id} variant="outline">
                <ItemContent>
                  <ItemTitle>{key.name}</ItemTitle>
                  <ItemDescription>
                    {key.lastUsedAt
                      ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
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
                        await confirmed(() => request(destroy(key.id)));
                        await load();
                        router.reload({ only: ["account"] });
                      }, "Passkey removed.")
                    }
                  />
                </ItemActions>
              </Item>
            ))
          )}
          <form
            id="passkey-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const name = String(new FormData(form).get("name"));
              void operation.run(async () => {
                const { Passkeys, ceremony } = await import("@/lib/auth/passkeys");
                await confirmed(async () => {
                  const status = await request<{ confirmed: boolean }>(confirmation());
                  if (!status.confirmed) throw new AccountError(423);
                  return ceremony(() =>
                    Passkeys.register({
                      name,
                      routes: { options: registrationOptions.url(), submit: store.url() },
                    }),
                  );
                });
                form.reset();
                await load();
                router.reload({ only: ["account"] });
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
          </form>
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
