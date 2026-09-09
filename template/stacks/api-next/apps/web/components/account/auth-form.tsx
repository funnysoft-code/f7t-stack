"use client";

import { useState } from "react";
import { SafeForm } from "./safe-form";
import { TurnstileCheck } from "./turnstile-check";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { InputField } from "./input-field";
import { Feedback, Submit } from "./feedback";
import { useOperation } from "./use-operation";
import { request, AccountError } from "@/lib/auth/flows";
import { localDestination, authDestination } from "@/lib/api/auth";
import { browserApi, initializeCsrf } from "@/lib/api/browser";
import type { AccountProps } from "@/types/account";

export type AuthMode = "login" | "register" | "forgot" | "reset" | "confirm" | "challenge";
const copy: Record<AuthMode, [string, string, string]> = {
  login: ["Welcome back", "Sign in to manage your account.", "Sign in"],
  register: ["Create your account", "Use an email address you can access.", "Create account"],
  forgot: [
    "Forgot your password?",
    "We will send a link if an account uses this email.",
    "Send reset link",
  ],
  reset: [
    "Choose a new password",
    "Use at least 12 characters. Other sessions will be signed out.",
    "Reset password",
  ],
  confirm: [
    "Confirm it's you",
    "Confirm your identity to continue to the requested page.",
    "Confirm and continue",
  ],
  challenge: [
    "Check your authenticator",
    "Enter the code from your authenticator app, or use a recovery code.",
    "Verify and sign in",
  ],
};

export function AuthForm({ mode, ...props }: AccountProps & { mode: AuthMode }) {
  const [recovery, setRecovery] = useState(false);
  const [remember, setRemember] = useState(false);
  const protectedForm =
    ["register", "forgot"].includes(mode) && process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true";
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const operation = useOperation();
  const passkey = useOperation();
  const [title, description, action] = copy[mode];
  if (mode === "register" && !props.registration)
    return <Feedback error message="Registration is closed. Return to sign in." />;
  return (
    <Card className="form-card">
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SafeForm
          id="auth-form"
          onSubmit={(event) => {
            // eslint-disable-next-line react-doctor/no-prevent-default -- Laravel JSON mutations must relay cookies through the browser proxy.
            event.preventDefault();
            if (operation.pending || (protectedForm && !token)) return;
            const form = event.currentTarget;
            const data = new FormData(form);
            const security = protectedForm ? { turnstile_token: token } : {};
            if (protectedForm) setToken("");
            const email = String(data.get("email") ?? "");
            const password = String(data.get("password") ?? "");
            const password_confirmation = String(data.get("password_confirmation") ?? "");
            void operation
              .run(
                async () => {
                  if (["login", "register", "forgot", "reset", "challenge"].includes(mode)) {
                    const csrf = await initializeCsrf();
                    if (!csrf.ok) throw new AccountError(csrf.status);
                  }
                  if (mode === "login") {
                    const result = await request(
                      browserApi.POST("/auth/login", { body: { email, password, remember } }),
                    );
                    window.location.assign(
                      result?.two_factor
                        ? authDestination("/two-factor-challenge", props.returnTo ?? null)
                        : localDestination(props.returnTo ?? null),
                    );
                  }
                  if (mode === "register") {
                    await request(
                      browserApi.POST("/auth/register", {
                        body: {
                          ...security,
                          name: String(data.get("name") ?? ""),
                          email,
                          password,
                          password_confirmation,
                        },
                      }),
                    );
                    window.location.assign("/verify-email");
                  }
                  if (mode === "forgot") {
                    await request(
                      browserApi.POST("/auth/forgot-password", { body: { email, ...security } }),
                    );
                  }
                  if (mode === "reset") {
                    await request(
                      browserApi.POST("/auth/reset-password", {
                        body: { email, password, password_confirmation, token: props.token ?? "" },
                      }),
                    );
                    form.reset();
                  }
                  if (mode === "confirm") {
                    await request(
                      browserApi.POST("/auth/confirm-password", { body: { password } }),
                    );
                    window.location.assign(localDestination(props.returnTo ?? null));
                  }
                  if (mode === "challenge") {
                    await request(
                      browserApi.POST("/auth/two-factor-challenge", {
                        body: recovery
                          ? { recovery_code: String(data.get("recovery_code") ?? "") }
                          : { code: String(data.get("code") ?? "") },
                      }),
                    );
                    window.location.assign(localDestination(props.returnTo ?? null));
                  }
                },
                mode === "forgot"
                  ? "If an account uses that address, a reset link is on its way. Check your inbox."
                  : mode === "reset"
                    ? "Password reset. You can now sign in with your new password."
                    : "",
              )
              .finally(() => {
                if (protectedForm) setAttempt((value) => value + 1);
              });
          }}
        >
          <FieldGroup>
            <Feedback error message={operation.error} />
            <Feedback message={operation.success} />
            {protectedForm ? (
              <TurnstileCheck attempt={attempt} ready={!!token} onToken={setToken} />
            ) : null}
            <Feedback error message={operation.fields.turnstile_token?.[0]} />
            {mode === "register" ? (
              <InputField
                label="Full name"
                name="name"
                autoComplete="name"
                required
                error={operation.fields.name}
              />
            ) : null}
            {["login", "register", "forgot", "reset"].includes(mode) ? (
              <InputField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={props.email}
                required
                error={operation.fields.email}
              />
            ) : null}
            {["login", "register", "reset", "confirm"].includes(mode) ? (
              <InputField
                label={mode === "reset" ? "New password" : "Password"}
                name="password"
                type="password"
                autoComplete={
                  mode === "register" || mode === "reset" ? "new-password" : "current-password"
                }
                minLength={mode === "register" || mode === "reset" ? 12 : undefined}
                hint={
                  mode === "register" || mode === "reset"
                    ? "Use at least 12 characters."
                    : undefined
                }
                required
                error={operation.fields.password}
              />
            ) : null}
            {mode === "register" || mode === "reset" ? (
              <InputField
                label="Confirm password"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                error={operation.fields.password_confirmation}
              />
            ) : null}
            {mode === "challenge" ? (
              <InputField
                key={String(recovery)}
                label={recovery ? "Recovery code" : "Authenticator code"}
                name={recovery ? "recovery_code" : "code"}
                autoComplete="one-time-code"
                inputMode={recovery ? "text" : "numeric"}
                required
                error={operation.fields[recovery ? "recovery_code" : "code"]}
              />
            ) : null}
            {mode === "login" ? (
              <Field orientation="horizontal">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(value) => setRemember(value === true)}
                />
                <FieldLabel htmlFor="remember">Keep me signed in on this device</FieldLabel>
              </Field>
            ) : null}
          </FieldGroup>
        </SafeForm>
      </CardContent>
      <CardFooter className="form-actions">
        <Submit
          form="auth-form"
          pending={operation.pending || passkey.pending}
          disabled={operation.pending || passkey.pending || (protectedForm && !token)}
        >
          {action}
        </Submit>
        {mode === "login" ? (
          <Link href="/forgot-password">Forgot password?</Link>
        ) : (
          <Link href={authDestination("/login", props.returnTo ?? null)}>Back to sign in</Link>
        )}
      </CardFooter>
      {mode === "login" || mode === "confirm" ? (
        <CardContent>
          <Feedback error message={passkey.error} />
          <Button
            className="w-full"
            variant="outline"
            disabled={passkey.pending || operation.pending}
            onClick={() =>
              void passkey.run(async () => {
                const csrf = await initializeCsrf();
                if (!csrf.ok) throw new AccountError(csrf.status);
                const [{ Passkeys }, { passkeyRoutes }] = await Promise.all([
                  import("@laravel/passkeys"),
                  import("@/lib/api/passkeys"),
                ]);
                await Passkeys.verify({
                  routes: mode === "confirm" ? passkeyRoutes.confirmation : passkeyRoutes.login,
                  remember,
                });
                window.location.assign(localDestination(props.returnTo ?? null));
              })
            }
          >
            {passkey.pending
              ? "Waiting for your device…"
              : mode === "confirm"
                ? "Confirm with a passkey"
                : "Sign in with a passkey"}
          </Button>
        </CardContent>
      ) : null}
      {mode === "challenge" ? (
        <CardContent>
          <Button variant="outline" onClick={() => setRecovery(!recovery)}>
            {recovery ? "Use authenticator code" : "Use a recovery code"}
          </Button>
        </CardContent>
      ) : null}
      {mode === "login" && props.registration ? (
        <CardContent>
          <Link href="/register">Create an account</Link>
        </CardContent>
      ) : null}
      {mode === "reset" && operation.success ? (
        <CardContent>
          <Button asChild>
            <Link href={authDestination("/login", props.returnTo ?? null)}>Sign in</Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
