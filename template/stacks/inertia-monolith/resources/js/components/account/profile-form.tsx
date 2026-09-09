import { router } from "@inertiajs/react";
import { SafeForm } from "./safe-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { InputField } from "./input-field";
import { Submit, Feedback } from "./feedback";
import { useOperation } from "./use-operation";
import { useConfirmed } from "./confirmation";
import { request } from "@/lib/auth/flows";
import { update } from "@/routes/settings/profile";
import { notice } from "@/routes/verification";
import type { AccountProps } from "@/types/account";

export function ProfileForm({ account }: Pick<AccountProps, "account">) {
  const operation = useOperation();
  const confirmed = useConfirmed();
  if (!account) return null;
  return (
    <Card className="form-card">
      <CardHeader>
        <div className="profile-identity">
          <Avatar className="size-16">
            <AvatarFallback>{account.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>
              <h2>{account.name}</h2>
            </CardTitle>
            <CardDescription>
              {account.verified ? "Personal account" : "Correct your email address"}
            </CardDescription>
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent>
        <SafeForm
          id="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            void operation.run(async () => {
              await confirmed(() =>
                request(update(), { ...data, name: account.verified ? data.name : account.name }),
              );
              if (data.email !== account.email) router.visit(notice.url());
              else router.reload();
            }, "Profile saved.");
          }}
        >
          <FieldGroup>
            <Feedback error message={operation.error} />
            <Feedback message={operation.success} />
            {account.verified ? (
              <InputField
                label="Full name"
                name="name"
                autoComplete="name"
                required
                defaultValue={account.name}
                error={operation.fields.name}
              />
            ) : null}
            <InputField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={account.email}
              error={operation.fields.email}
              hint="Changing your email requires confirmation. We will send a new verification link."
            />
          </FieldGroup>
        </SafeForm>
      </CardContent>
      <CardFooter>
        <Submit form="profile-form" pending={operation.pending}>
          {account.verified ? "Save changes" : "Update email address"}
        </Submit>
      </CardFooter>
    </Card>
  );
}
