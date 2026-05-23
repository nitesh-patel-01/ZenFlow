import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZenFlow - Productivity & Wellness",
  description: "All-in-one productivity and wellness app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZenFlow",
  },
  verification: {
    google: "SHXBgKQDetfXVSTxrkNc3DpOPFOprbCzGpSiMs-tpKc",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c63ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
