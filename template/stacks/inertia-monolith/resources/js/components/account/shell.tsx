import { Head, Link } from "@inertiajs/react";
import { ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavbarSettingsHeader } from "./navbar-settings-header";
import { ConfirmationProvider } from "./confirmation";
import { security } from "@/routes/settings";
import type { AccountProps } from "@/types/account";

export function Shell({
  title,
  description,
  account,
  children,
}: Pick<AccountProps, "account"> & { title: string; description: string; children: ReactNode }) {
  return (
    <ConfirmationProvider>
      <Head title={`${title} | Account`} />
      <a className="skip-link" href="#main">
        Skip to account content
      </a>
      <div className="account-shell">
        <NavbarSettingsHeader account={account} />
        <main id="main" tabIndex={-1} className="account-workspace">
          <p className="account-crumb">Your account / {title}</p>
          <div className="account-heading">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="account-layout">
            <section className="account-form" aria-label={title}>
              {children}
            </section>
            <Card className="account-companion">
              <CardHeader>
                <ShieldCheckIcon aria-hidden="true" className="size-9" />
                <CardTitle>
                  <h2>Your access, at a glance.</h2>
                </CardTitle>
                <CardDescription>
                  Know what is protecting your account while you make a change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul>
                  <li>
                    <strong>Email verification</strong>
                    <span>
                      {account
                        ? account.verified
                          ? "Your email address is verified."
                          : "Verify your email to access the app."
                        : "Only you should have access to your inbox."}
                    </span>
                    {account ? (
                      <Badge variant="outline">
                        {account.verified ? "Verified" : "Action needed"}
                      </Badge>
                    ) : null}
                  </li>
                  <li>
                    <strong>Passkeys</strong>
                    <span>
                      {account
                        ? `${account.passkeyCount} enrolled. Use your fingerprint, face, or device PIN.`
                        : "A secure sign-in with your fingerprint, face, or device PIN."}
                    </span>
                  </li>
                  <li>
                    <strong>Account recovery</strong>
                    <span>
                      {account?.authenticatorConfirmed
                        ? "Authenticator enabled. Keep your recovery codes somewhere safe."
                        : "Add an authenticator app for another layer of protection."}
                    </span>
                  </li>
                </ul>
                {account?.verified ? (
                  <Link href={security.url()}>Review security settings</Link>
                ) : null}
                <p className="companion-note">
                  Your password and security codes are never included in your account summary.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ConfirmationProvider>
  );
}
