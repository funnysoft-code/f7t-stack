import { Link } from "@inertiajs/react";
import { Shell } from "@/components/account/shell";
import { AccountChangePassword } from "@/components/account/account-change-password";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { passkeys, authenticator, recovery, deleteMethod } from "@/routes/settings";
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
          <ItemDescription>
            {account?.passkeyCount ?? 0} enrolled. Sign in with your device.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" asChild>
            <Link href={passkeys.url()}>Manage passkeys</Link>
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
            {account?.authenticatorConfirmed
              ? "Enabled for password sign-in."
              : account?.authenticatorPending
                ? "Setup started. Confirm a code to finish."
                : "Add a second step to password sign-in."}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" asChild>
            <Link href={authenticator.url()}>Manage authenticator</Link>
          </Button>
        </ItemActions>
      </Item>
      {account?.authenticatorConfirmed ? (
        <Item>
          <ItemContent>
            <ItemTitle>Recovery codes</ItemTitle>
            <ItemDescription>
              Keep single-use codes for when your phone is unavailable.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" asChild>
              <Link href={recovery.url()}>View recovery codes</Link>
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
            <Link href={deleteMethod.url()}>Delete account</Link>
          </Button>
        </ItemActions>
      </Item>
    </Shell>
  );
}
