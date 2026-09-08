"use client";
import { Button } from "@/components/ui/button";
export function RetryPage() {
  return <Button onClick={() => window.location.reload()}>Retry loading this page</Button>;
}
