"use client";

import { useState } from "react";
import { Shell } from "@/components/account/shell";
import { useConfirmed } from "@/components/account/confirmation";
import { useOperation } from "@/components/account/use-operation";
import { Feedback, Submit } from "@/components/account/feedback";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DestructiveAction } from "@/components/account/destructive-action";
import { request, AccountError } from "@/lib/auth/flows";
import { browserApi } from "@/lib/api/browser";
import type { AccountProps } from "@/types/account";
function RecoveryForm({ account }: Pick<AccountProps, "account">) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [codesInvalidated, setCodesInvalidated] = useState(false);
  const operation = useOperation();
  const confirmed = useConfirmed();
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>Keep a way back in</h2>
        </CardTitle>
        <CardDescription>
          Each code works once, instead of an authenticator code. Store them in a password manager
          or another private place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Feedback error message={operation.error} />
        <Feedback message={operation.success} />
        {codes ? (
          <ul className="recovery-codes" aria-label="Recovery codes">
            {codes.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {codesInvalidated
              ? "Your old codes no longer work. Load the replacement codes to save them."
              : account?.two_factor_confirmed
                ? "Confirm your identity to reveal your recovery codes."
                : "Finish setting up your authenticator before viewing recovery codes."}
          </p>
        )}
      </CardContent>
      <CardFooter className="form-actions">
        {!codes ? (
          <Submit
            type="button"
            disabled={!account?.two_factor_confirmed || operation.pending}
            pending={operation.pending}
            onClick={() =>
              void operation.run(async () => {
                setCodes(
                  await confirmed(() =>
                    request(browserApi.GET("/auth/user/two-factor-recovery-codes")),
                  ),
                );
                setCodesInvalidated(false);
              })
            }
          >
            {codesInvalidated ? "Retry loading recovery codes" : "Show recovery codes"}
          </Submit>
        ) : (
          <>
            <Button variant="outline" disabled={operation.pending} onClick={() => setCodes(null)}>
              Hide codes
            </Button>
            <Button
              variant="outline"
              disabled={operation.pending}
              onClick={() =>
                void operation.run(async () => {
                  try {
                    await navigator.clipboard.writeText(codes.join("\n"));
                  } catch {
                    throw new AccountError(
                      422,
                      "Copy is unavailable. Select and copy your codes manually.",
                    );
                  }
                }, "Recovery codes copied. Store them somewhere private.")
              }
            >
              Copy codes
            </Button>
            <DestructiveAction
              label="Generate new codes"
              description="All previous recovery codes will stop working. Save the new set after generating it."
              disabled={operation.pending}
              onConfirm={() =>
                void operation.run(async () => {
                  await confirmed(() =>
                    request(browserApi.POST("/auth/user/two-factor-recovery-codes")),
                  );
                  setCodes(null);
                  setCodesInvalidated(true);
                  setCodes(
                    await confirmed(() =>
                      request(browserApi.GET("/auth/user/two-factor-recovery-codes")),
                    ),
                  );
                  setCodesInvalidated(false);
                }, "New recovery codes generated. Your old codes no longer work.")
              }
            />
          </>
        )}
      </CardFooter>
    </Card>
  );
}
export default function Recovery({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Recovery codes"
      description="For when your authenticator is unavailable."
    >
      <RecoveryForm account={account} />
    </Shell>
  );
}
