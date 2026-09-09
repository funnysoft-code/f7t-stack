import Link from "next/link";
import { Shell } from "@/components/account/shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AccountProps } from "@/types/account";
export default function Home({ account }: AccountProps) {
  return (
    <Shell
      account={account}
      title={`Welcome, ${account?.name ?? "back"}`}
      description="Your personal account is ready."
    >
      <Card className="form-card">
        <CardHeader>
          <CardTitle>
            <h2>Make yourself at home</h2>
          </CardTitle>
          <CardDescription>Manage your details and the ways you sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Email verified</Badge>
          <p className="home-email">{account?.email}</p>
        </CardContent>
        <CardFooter className="form-actions">
          <Button asChild>
            <Link href="/settings/profile">Edit profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/security">Review security</Link>
          </Button>
        </CardFooter>
      </Card>
    </Shell>
  );
}
