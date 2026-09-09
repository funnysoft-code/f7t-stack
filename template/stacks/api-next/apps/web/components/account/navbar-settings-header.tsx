// Adapted from shadcn.io/navbar-settings-header, with route-aware navigation.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { browserApi } from "@/lib/api/browser";
import { request } from "@/lib/auth/flows";
import { Feedback } from "./feedback";
import { useOperation } from "./use-operation";
import type { AccountProps } from "@/types/account";

export function NavbarSettingsHeader({ account }: Pick<AccountProps, "account">) {
  const url = usePathname();
  const operation = useOperation();
  const links = account?.email_verified
    ? [
        ["Home", "/app"],
        ["Profile", "/settings/profile"],
        ["Security", "/settings/security"],
      ]
    : account
      ? [["Verify email", "/verify-email"]]
      : [["Sign in", "/login"]];
  return (
    <>
      <header className="account-header">
        <Link className="account-brand" href="/app">
          Account
        </Link>
        <NavigationMenu viewport={false} aria-label="Account">
          <NavigationMenuList>
            {links.map(([label, href]) => (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink
                  asChild
                  active={
                    url === href ||
                    (label === "Security" &&
                      /settings\/(security|passkeys|authenticator|recovery|delete)/.test(url))
                  }
                >
                  <Link href={href}>{label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {account ? (
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  disabled={operation.pending}
                  onClick={() =>
                    void operation.run(async () => {
                      await request(browserApi.POST("/auth/logout"));
                      window.location.assign("/login");
                    })
                  }
                >
                  Sign out
                </Button>
              </NavigationMenuItem>
            ) : null}
          </NavigationMenuList>
        </NavigationMenu>
        {account ? (
          <div className="account-identity">
            <Avatar>
              <AvatarFallback>{account.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>
              {account.name}
              <small>Personal account</small>
            </span>
          </div>
        ) : null}
      </header>
      <Feedback error message={operation.error} />
    </>
  );
}
