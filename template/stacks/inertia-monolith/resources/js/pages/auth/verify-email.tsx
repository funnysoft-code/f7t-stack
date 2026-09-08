import { useState } from "react";
import { router } from "@inertiajs/react";
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
import { request } from "@/lib/auth/flows";
import { send } from "@/routes/verification";
import { home } from "@/routes";
import type { AccountProps } from "@/types/account";
export default function VerifyEmail({ account }: AccountProps) {
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
            We sent a verification link to {account?.email}. Open the link to confirm this address
            belongs to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Feedback error message={operation.error} />
          <Feedback message={operation.success} />
        </CardContent>
        <CardFooter className="form-actions">
          <Submit
            type="button"
            pending={operation.pending}
            onClick={() =>
              void operation.run(
                () => request(send()),
                "A new verification link is on its way. Check your inbox and spam folder.",
              )
            }
          >
            Resend verification email
          </Submit>
          <Button variant="outline" onClick={() => router.visit(home.url())}>
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
