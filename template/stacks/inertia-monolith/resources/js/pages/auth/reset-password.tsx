import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Reset(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="New password"
      description="Choose a password you do not use elsewhere."
    >
      <AuthForm mode="reset" {...props} />
    </Shell>
  );
}
