import { Shell } from "@/components/account/shell";
import { useConfirmed } from "@/components/account/confirmation";
import { useOperation } from "@/components/account/use-operation";
import { Feedback } from "@/components/account/feedback";
import { DestructiveAction } from "@/components/account/destructive-action";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { request } from "@/lib/auth/flows";
import { destroy } from "@/routes/settings/account";
import { login } from "@/routes";
import type { AccountProps } from "@/types/account";
function DeleteForm() {
  const confirmed = useConfirmed();
  const operation = useOperation();
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>This cannot be undone</h2>
        </CardTitle>
        <CardDescription>
          Your profile, passkeys, authenticator and recovery codes will be removed. All your
          sessions will lose access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Feedback error message={operation.error} />
      </CardContent>
      <CardFooter>
        <DestructiveAction
          label="Delete account"
          description="Your account and sign-in methods will be permanently deleted. You may be asked to confirm your identity."
          disabled={operation.pending}
          onConfirm={() =>
            void operation.run(async () => {
              await confirmed(() => request(destroy()));
              window.location.assign(login.url());
            })
          }
        />
      </CardFooter>
    </Card>
  );
}
export default function DeleteAccount({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Delete your account"
      description="Permanently remove your personal account."
    >
      <DeleteForm />
    </Shell>
  );
}
