"use client";

import { useRouter } from "next/navigation";
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
import { browserApi } from "@/lib/api/browser";
import type { AccountProps } from "@/types/account";

export function ProfileForm({ account }: Pick<AccountProps, "account">) {
  const router = useRouter();
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
              {account.email_verified ? "Personal account" : "Correct your email address"}
            </CardDescription>
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent>
        <form
          id="profile-form"
          onSubmit={(event) => {
            // eslint-disable-next-line react-doctor/no-prevent-default -- Laravel JSON mutations must relay cookies through the browser proxy.
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            void operation.run(async () => {
              await confirmed(() =>
                request(
                  browserApi.PATCH("/auth/settings/profile", {
                    body: {
                      email: String(data.email),
                      ...(account.email_verified ? { name: String(data.name) } : {}),
                    },
                  }),
                ),
              );
              if (data.email !== account.email) window.location.assign("/verify-email");
              else router.refresh();
            }, "Profile saved.");
          }}
        >
          <FieldGroup>
            <Feedback error message={operation.error} />
            <Feedback message={operation.success} />
            {account.email_verified ? (
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
        </form>
      </CardContent>
      <CardFooter className="form-actions">
        <Submit form="profile-form" pending={operation.pending}>
          {account.email_verified ? "Save changes" : "Update email address"}
        </Submit>
      </CardFooter>
    </Card>
  );
}
