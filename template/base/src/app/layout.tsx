import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "__F7T_APP_NAME__",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="__F7T_HTML_LANG__">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
