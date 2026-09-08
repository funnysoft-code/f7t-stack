"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics/client";

export function AnalyticsBootstrap() {
  useEffect(() => {
    void analytics.capture("app_loaded");
  }, []);
  return null;
}
