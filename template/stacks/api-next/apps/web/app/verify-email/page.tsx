import { VerificationScreen, type Query } from "@/components/account/server-screen";
export default function Page({ searchParams }: { searchParams: Query }) {
  return <VerificationScreen searchParams={searchParams} />;
}
