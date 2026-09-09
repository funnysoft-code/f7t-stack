import Link from "next/link";
import { Shell } from "@/components/account/shell";
import { AccountChangePassword } from "@/components/account/account-change-password";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AccountProps } from "@/types/account";
export default function Security({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Sign-in & security"
      description="Choose how you sign in. Keep a reliable way back in."
    >
      <AccountChangePassword />
      <Separator />
      <Item>
        <ItemContent>
          <ItemTitle>
            <h2>Passkeys</h2>
          </ItemTitle>
          <ItemDescription>Manage your enrolled devices and add a passkey.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" asChild>
            <Link href="/settings/passkeys">Manage passkeys</Link>
          </Button>
        </ItemActions>
      </Item>
      <Separator />
      <Item>
        <ItemContent>
          <ItemTitle>
            <h2>Authenticator app</h2>
          </ItemTitle>
          <ItemDescription>
            {account?.two_factor_confirmed
              ? "Enabled for password sign-in."
              : account?.two_factor_enabled
                ? "Setup started. Confirm a code to finish."
                : "Add a second step to password sign-in."}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" asChild>
            <Link href="/settings/authenticator">Manage authenticator</Link>
          </Button>
        </ItemActions>
      </Item>
      {account?.two_factor_confirmed ? (
        <Item>
          <ItemContent>
            <ItemTitle>Recovery codes</ItemTitle>
            <ItemDescription>
              Keep single-use codes for when your phone is unavailable.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" asChild>
              <Link href="/settings/recovery">View recovery codes</Link>
            </Button>
          </ItemActions>
        </Item>
      ) : null}
      <Separator />
      <Item>
        <ItemContent>
          <ItemTitle>
            <h2>Delete account</h2>
          </ItemTitle>
          <ItemDescription>
            Permanently remove your account and its sign-in methods.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" asChild>
            <Link href="/settings/delete-account">Delete account</Link>
          </Button>
        </ItemActions>
      </Item>
    </Shell>
  );
}
