import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Closebook — Modern Production & Project OS",
  description:
    "Zero-budget, user-owned production management system. Connects directly to your Google Drive & Sheets with zero vendor lock-in.",
  applicationName: "Closebook",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Closebook — Modern Production & Project OS",
    description:
      "A black canvas for production curators and project leads. Direct BYOS sync with your Google Workspace.",
    siteName: "Closebook",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { PreferencesProvider } from "@/lib/preferences";
import PreferencesModal from "@/components/PreferencesModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[var(--surface-canvas,#050505)] text-[var(--color-paper,#fdfdfd)] antialiased selection:bg-[var(--color-primary,#ff1e42)] selection:text-[#ffffff]">
        <PreferencesProvider>
          {children}
          <PreferencesModal />
        </PreferencesProvider>
      </body>
    </html>
  );
}
