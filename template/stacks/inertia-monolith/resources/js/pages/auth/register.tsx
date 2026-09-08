import { Shell } from "@/components/account/shell";
import { AuthForm } from "@/components/account/auth-form";
import type { AccountProps } from "@/types/account";
export default function Register(props: AccountProps) {
  return (
    <Shell
      account={props.account}
      title="Create account"
      description="Start with your details. Verify your email next."
    >
      <AuthForm mode="register" {...props} />
    </Shell>
  );
}
