import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main className="account-workspace" aria-label="Loading account">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="mt-8 h-96 w-full" />
    </main>
  );
}
