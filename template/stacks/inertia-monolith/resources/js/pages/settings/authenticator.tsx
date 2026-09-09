import { useState } from "react";
import { SafeForm } from "@/components/account/safe-form";
import { Link, router } from "@inertiajs/react";
import { Shell } from "@/components/account/shell";
import { useConfirmed } from "@/components/account/confirmation";
import { useOperation } from "@/components/account/use-operation";
import { InputField } from "@/components/account/input-field";
import { Feedback, Submit } from "@/components/account/feedback";
import { DestructiveAction } from "@/components/account/destructive-action";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/ui/qr-code";
import { request, AccountError } from "@/lib/auth/flows";
import { enable, confirm, disable, qrCode, secretKey } from "@/routes/two-factor";
import { recovery } from "@/routes/settings";
import type { AccountProps } from "@/types/account";

function AuthenticatorForm({ account }: Pick<AccountProps, "account">) {
  const [setup, setSetup] = useState<{ url: string; secretKey: string } | null>(null);
  const operation = useOperation();
  const confirmed = useConfirmed();
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>
            {account?.authenticatorConfirmed ? "Authenticator enabled" : "Set up an authenticator"}
          </h2>
        </CardTitle>
        <CardDescription>
          {account?.authenticatorConfirmed
            ? "Password sign-in requires an authenticator or recovery code. A verified passkey can sign you in directly."
            : "Scan a QR code or enter a setup key in your authenticator app, then confirm with its six-digit code."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Feedback error message={operation.error} />
          <Feedback message={operation.success} />
          {setup && !account?.authenticatorConfirmed ? (
            <>
              <QRCode data={setup.url} />
              <Field>
                <FieldLabel htmlFor="setup-key">Manual setup key</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="setup-key" value={setup.secretKey} readOnly />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      onClick={() =>
                        void operation.run(async () => {
                          try {
                            await navigator.clipboard.writeText(setup.secretKey);
                          } catch {
                            throw new AccountError(
                              422,
                              "Copy is unavailable. Select and copy the setup key manually.",
                            );
                          }
                        }, "Setup key copied. Keep it private.")
                      }
                    >
                      Copy
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <SafeForm
                id="authenticator-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = Object.fromEntries(new FormData(event.currentTarget));
                  void operation.run(async () => {
                    await confirmed(() => request(confirm(), data));
                    setSetup(null);
                    router.visit(recovery.url());
                  });
                }}
              >
                <InputField
                  label="Authenticator code"
                  name="code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  pattern="[0-9]{6}"
                  error={operation.fields.code}
                />
              </SafeForm>
            </>
          ) : null}
        </FieldGroup>
      </CardContent>
      <CardFooter className="form-actions">
        {!account?.authenticatorConfirmed && !setup ? (
          <Submit
            type="button"
            pending={operation.pending}
            onClick={() =>
              void operation.run(async () => {
                if (!account?.authenticatorPending) await confirmed(() => request(enable()));
                const [qr, secret] = await confirmed(() =>
                  Promise.all([
                    request<{ url: string }>(qrCode()),
                    request<{ secretKey: string }>(secretKey()),
                  ]),
                );
                setSetup({ url: qr.url, secretKey: secret.secretKey });
                router.reload({ only: ["account"] });
              })
            }
          >
            {account?.authenticatorPending ? "Continue setup" : "Set up authenticator"}
          </Submit>
        ) : null}
        {setup && !account?.authenticatorConfirmed ? (
          <Submit form="authenticator-form" pending={operation.pending}>
            Confirm authenticator
          </Submit>
        ) : null}
        {account?.authenticatorConfirmed ? (
          <Button variant="outline" asChild>
            <Link href={recovery.url()}>View recovery codes</Link>
          </Button>
        ) : null}
        {account?.authenticatorPending || setup ? (
          <DestructiveAction
            label={account?.authenticatorConfirmed ? "Remove authenticator" : "Cancel setup"}
            description="Password sign-in will no longer require authenticator codes. Existing recovery codes will stop working."
            disabled={operation.pending}
            onConfirm={() =>
              void operation.run(async () => {
                await confirmed(() => request(disable()));
                setSetup(null);
                router.reload({ only: ["account"] });
              }, "Authenticator removed.")
            }
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
export default function Authenticator({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Authenticator app"
      description="Add a second step to password sign-in."
    >
      <AuthenticatorForm account={account} />
    </Shell>
  );
}
