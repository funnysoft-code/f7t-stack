import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Confirm(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="Confirm your identity"
      description="An extra check before a sensitive action."
    >
      <AuthForm mode="confirm" {...props} />
    </Shell>
  );
}
