import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { serverAccount, serverRead } from "@/lib/api/server";
import { authDestination, localDestination, verificationContinuation } from "@/lib/api/auth";
import type { AccountProps } from "@/types/account";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
import { AuthForm, type AuthMode } from "./auth-form";
import VerifyEmail from "@/components/screens/verify-email";
import { RetryPage } from "./retry-page";

export type Query = Promise<Record<string, string | string[] | undefined>>;
const value = (item: string | string[] | undefined) => (typeof item === "string" ? item : null);

const titles: Record<AuthMode, string> = {
  login: "Sign in",
  register: "Create an account",
  forgot: "Reset your password",
  reset: "New password",
  confirm: "Confirm your identity",
  challenge: "Two-step sign-in",
};

function Unavailable() {
  return (
    <Shell account={null} title="Account unavailable" description="We could not load your account.">
      <Feedback
        error
        message="Account services could not be reached. Your sign-in status has not been changed."
      />
      <RetryPage />
    </Shell>
  );
}

export async function ProtectedScreen({
  screen: Screen,
  path,
}: {
  screen: ComponentType<AccountProps>;
  path: string;
}) {
  const state = await serverAccount();
  if (state.kind === "guest") redirect(authDestination("/login", path));
  if (state.kind === "unverified")
    redirect(`/verify-email?next=${encodeURIComponent(localDestination(path))}`);
  if (state.kind !== "verified") return <Unavailable />;
  return <Screen account={state.user} />;
}

export async function AuthScreen({ mode, searchParams }: { mode: AuthMode; searchParams: Query }) {
  const query = await searchParams;
  const next = localDestination(value(query.next));
  const state = await serverAccount();
  if (state.kind !== "guest" && state.kind !== "verified" && state.kind !== "unverified")
    return <Unavailable />;
  if (mode === "confirm" && state.kind === "guest") redirect(authDestination("/login", next));
  if (["login", "register", "challenge"].includes(mode) && state.kind !== "guest")
    redirect(state.kind === "verified" ? next : `/verify-email?next=${encodeURIComponent(next)}`);
  let registration = false;
  if (mode === "login" || mode === "register") {
    const response = await serverRead("/api/auth/capabilities");
    if (!response.ok) return <Unavailable />;
    const result = await response.json().catch(() => null);
    if (typeof result?.data?.registration !== "boolean") return <Unavailable />;
    registration = result.data.registration;
  }
  return (
    <Shell
      account={"user" in state ? state.user : null}
      title={titles[mode]}
      description="Your personal account, with secure access."
    >
      <AuthForm
        mode={mode}
        account={"user" in state ? state.user : null}
        registration={registration}
        returnTo={next}
        token={value(query.token) ?? undefined}
        email={value(query.email) ?? undefined}
      />
    </Shell>
  );
}

export async function VerificationScreen({ searchParams }: { searchParams: Query }) {
  const query = await searchParams;
  const signed = verificationContinuation(value(query.verification_url));
  const next = localDestination(value(query.next));
  const state = await serverAccount();
  // eslint-disable-next-line react-doctor/clickjacking-redirect-risk -- Both helpers validate the exact local route and signed verification mount.
  if (state.kind === "guest")
    redirect(
      authDestination(
        "/login",
        signed ? `/verify-email?verification_url=${encodeURIComponent(signed)}` : `/verify-email`,
      ),
    );
  if (state.kind !== "verified" && state.kind !== "unverified") return <Unavailable />;
  if (state.kind === "verified" && !signed) redirect(next === "/verify-email" ? "/app" : next);
  return (
    <VerifyEmail
      account={state.user}
      verificationUrl={signed}
      returnTo={next === "/verify-email" ? "/app" : next}
    />
  );
}
