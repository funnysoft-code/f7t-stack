// Adapted from shadcn.io/account-change-password. Confirmation is a separate
// password-or-passkey step; validation and session invalidation belong to Laravel.
import { useState } from "react";
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
import { InputField } from "./input-field";
import { Feedback, Submit } from "./feedback";
import { useOperation } from "./use-operation";
import { useConfirmed } from "./confirmation";
import { request } from "@/lib/auth/flows";
import { update } from "@/routes/settings/password";

export function AccountChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const operation = useOperation();
  const confirmed = useConfirmed();
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>Password</h2>
        </CardTitle>
        <CardDescription>
          Use at least 12 characters. Changing your password signs out your other sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SafeForm
          id="password-form"
          onSubmit={(event) => {
            event.preventDefault();
            void operation.run(async () => {
              await confirmed(() =>
                request(update(), { password, password_confirmation: confirmation }),
              );
              setPassword("");
              setConfirmation("");
            }, "Password updated. Your other sessions will need to sign in again.");
          }}
        >
          <FieldGroup>
            <Feedback error message={operation.error} />
            <Feedback message={operation.success} />
            <InputField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={operation.fields.password}
            />
            <InputField
              label="Confirm new password"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              error={operation.fields.password_confirmation}
              hint={
                confirmation
                  ? password === confirmation
                    ? "Passwords match."
                    : "Passwords do not match yet."
                  : undefined
              }
            />
          </FieldGroup>
        </SafeForm>
      </CardContent>
      <CardFooter>
        <Submit form="password-form" pending={operation.pending}>
          Update password
        </Submit>
      </CardFooter>
    </Card>
  );
}
