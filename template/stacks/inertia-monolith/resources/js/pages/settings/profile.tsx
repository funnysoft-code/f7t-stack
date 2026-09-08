import { Shell } from "@/components/account/shell";
import { ProfileForm } from "@/components/account/profile-form";
import type { AccountProps } from "@/types/account";
import { Link } from "@inertiajs/react";
import { deleteMethod } from "@/routes/settings";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
export default function Profile({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title="Personal details"
      description="Choose how your name and email appear in your account."
    >
      <ProfileForm account={account} />
      <Card className="form-card mt-8">
        <CardHeader>
          <CardTitle>Account ownership</CardTitle>
          <CardDescription>Manage the personal information stored in your account.</CardDescription>
        </CardHeader>
        <CardFooter className="form-actions">
          <Link href={deleteMethod.url()}>Delete account</Link>
        </CardFooter>
      </Card>
    </Shell>
  );
}
