import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Challenge(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="Two-step verification"
      description="One more step to finish signing in."
    >
      <AuthForm mode="challenge" {...props} />
    </Shell>
  );
}
