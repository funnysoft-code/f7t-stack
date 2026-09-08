"use client";
import { Shell } from "@/components/account/shell";
import { Feedback } from "@/components/account/feedback";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Shell account={null} title="Account unavailable" description="We could not load this page.">
      <Feedback
        error
        message="Try loading the page again. Your account changes have not been confirmed."
      />
      <Button onClick={reset}>Try again</Button>
    </Shell>
  );
}
