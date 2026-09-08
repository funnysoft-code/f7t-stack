"use client";

import { useState } from "react";
import { Shell } from "@/components/account/shell";
import { ProfileForm } from "@/components/account/profile-form";
import { Feedback, Submit } from "@/components/account/feedback";
import { useOperation } from "@/components/account/use-operation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { request, AccountError } from "@/lib/auth/flows";
import { browserApi, browserRequest } from "@/lib/api/browser";
import { localDestination } from "@/lib/api/auth";
import type { AccountProps } from "@/types/account";
export default function VerifyEmail({
  account,
  verificationUrl,
  returnTo,
}: AccountProps & { verificationUrl: string | null }) {
  const [correcting, setCorrecting] = useState(false);
  const operation = useOperation();
  return (
    <Shell
      account={account}
      title="Check your inbox"
      description="Verify your email before you enter the app."
    >
      <Card className="form-card">
        <CardHeader>
          <CardTitle>
            <h2>Verify your email address</h2>
          </CardTitle>
          <CardDescription>
            Verify {account?.email}. Open the link in your inbox to confirm this address belongs to
            you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Feedback error message={operation.error} />
          <Feedback message={operation.success} />
        </CardContent>
        <CardFooter className="form-actions">
          {verificationUrl ? (
            <Submit
              type="button"
              pending={operation.pending}
              onClick={() =>
                void operation.run(async () => {
                  const result = await browserRequest(verificationUrl);
                  if (!result.ok)
                    throw new AccountError(
                      result.status,
                      "This verification link is invalid or expired. Request a new link.",
                    );
                  window.location.assign(localDestination(returnTo ?? null));
                })
              }
            >
              Verify email and continue
            </Submit>
          ) : null}
          <Submit
            type="button"
            pending={operation.pending}
            onClick={() =>
              void operation.run(
                () => request(browserApi.POST("/auth/email/verification-notification")),
                "A new verification link is on its way. Check your inbox and spam folder.",
              )
            }
          >
            Resend verification email
          </Submit>
          <Button
            variant="outline"
            onClick={() => window.location.assign(localDestination(returnTo ?? null))}
          >
            I've verified my email
          </Button>
          <Button variant="ghost" onClick={() => setCorrecting(!correcting)}>
            {correcting ? "Cancel email correction" : "Wrong email address?"}
          </Button>
        </CardFooter>
      </Card>
      {correcting ? <ProfileForm account={account} /> : null}
    </Shell>
  );
}
