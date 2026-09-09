import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Login(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="Sign in"
      description="Your details and security, in one place."
    >
      <AuthForm mode="login" {...props} />
    </Shell>
  );
}
