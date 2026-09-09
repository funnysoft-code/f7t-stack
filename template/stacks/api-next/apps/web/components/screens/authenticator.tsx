"use client";

import { useState } from "react";
import { SafeForm } from "@/components/account/safe-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { QRCode } from "@/components/account/qr-code";
import { request, AccountError } from "@/lib/auth/flows";
import { browserApi } from "@/lib/api/browser";
import type { AccountProps } from "@/types/account";

function AuthenticatorForm({ account }: Pick<AccountProps, "account">) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ url: string; secretKey: string } | null>(null);
  const operation = useOperation();
  const confirmed = useConfirmed();
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>
            {account?.two_factor_confirmed ? "Authenticator enabled" : "Set up an authenticator"}
          </h2>
        </CardTitle>
        <CardDescription>
          {account?.two_factor_confirmed
            ? "Password sign-in requires an authenticator or recovery code. A verified passkey can sign you in directly."
            : "Scan a QR code or enter a setup key in your authenticator app, then confirm with its six-digit code."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Feedback error message={operation.error} />
          <Feedback message={operation.success} />
          {setup && !account?.two_factor_confirmed ? (
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
                  // eslint-disable-next-line react-doctor/no-prevent-default -- Laravel JSON mutations must relay cookies through the browser proxy.
                  event.preventDefault();
                  const code = String(new FormData(event.currentTarget).get("code") ?? "");
                  void operation.run(async () => {
                    await confirmed(() =>
                      request(
                        browserApi.POST("/auth/user/confirmed-two-factor-authentication", {
                          body: { code },
                        }),
                      ),
                    );
                    setSetup(null);
                    window.location.assign("/settings/recovery");
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
        {!account?.two_factor_confirmed && !setup ? (
          <Submit
            type="button"
            pending={operation.pending}
            onClick={() =>
              void operation.run(async () => {
                if (!account?.two_factor_enabled)
                  await confirmed(() =>
                    request(browserApi.POST("/auth/user/two-factor-authentication")),
                  );
                const [qr, secret] = await confirmed(() =>
                  Promise.all([
                    request(browserApi.GET("/auth/user/two-factor-qr-code")),
                    request(browserApi.GET("/auth/user/two-factor-secret-key")),
                  ]),
                );
                setSetup({ url: qr.url, secretKey: secret.secretKey });
                router.refresh();
              })
            }
          >
            {account?.two_factor_enabled ? "Continue setup" : "Set up authenticator"}
          </Submit>
        ) : null}
        {setup && !account?.two_factor_confirmed ? (
          <Submit form="authenticator-form" pending={operation.pending}>
            Confirm authenticator
          </Submit>
        ) : null}
        {account?.two_factor_confirmed ? (
          <Button variant="outline" asChild>
            <Link href="/settings/recovery">View recovery codes</Link>
          </Button>
        ) : null}
        {account?.two_factor_enabled || setup ? (
          <DestructiveAction
            label={account?.two_factor_confirmed ? "Remove authenticator" : "Cancel setup"}
            description="Password sign-in will no longer require authenticator codes. Existing recovery codes will stop working."
            disabled={operation.pending}
            onConfirm={() =>
              void operation.run(async () => {
                await confirmed(() =>
                  request(browserApi.DELETE("/auth/user/two-factor-authentication")),
                );
                setSetup(null);
                router.refresh();
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
