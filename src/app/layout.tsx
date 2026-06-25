import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/components/loading";

export const metadata: Metadata = {
  title: "Xyberclan - Email Management Platform",
  description: "Manage your emails, audiences, broadcasts, and automations with Resend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider><LoadingProvider>{children}</LoadingProvider></ThemeProvider>
      </body>
    </html>
  );
}
