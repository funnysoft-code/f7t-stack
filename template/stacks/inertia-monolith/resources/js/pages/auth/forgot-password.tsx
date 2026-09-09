import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Forgot(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="Reset your password"
      description="Get a secure link to choose a new password."
    >
      <AuthForm mode="forgot" {...props} />
    </Shell>
  );
}
