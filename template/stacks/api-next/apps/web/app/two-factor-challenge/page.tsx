import { AuthScreen, type Query } from "@/components/account/server-screen";
export default function Page({ searchParams }: { searchParams: Query }) {
  return <AuthScreen mode="challenge" searchParams={searchParams} />;
}
