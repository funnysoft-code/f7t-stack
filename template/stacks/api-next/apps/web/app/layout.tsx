import type { ReactNode } from "react";
import "./globals.css";
import { AnalyticsBootstrap } from "@/components/analytics-bootstrap";

export const metadata = {
  title: { default: "Account", template: "%s | Account" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsBootstrap />
        {children}
      </body>
    </html>
  );
}
