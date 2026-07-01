import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PWARegister } from "@/components/pwa-register";
import { ErrorLogger } from "@/components/error-logger";

export const metadata: Metadata = {
  title: "Xmailo — Smart Email Platform by Xyberclan",
  description: "Xmailo is a modern email management platform built by Xyberclan. Smart compose, scheduling, tracking, and AI-powered replies — all in your browser.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Xmailo",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme")||"dark";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`
        }} />
        <ThemeProvider>
          <ErrorLogger />
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
