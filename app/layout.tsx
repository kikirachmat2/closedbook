import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClosedBook — Modern Production & Project OS",
  description:
    "Zero-budget, user-owned production management system. Connects directly to your Google Drive & Sheets with zero vendor lock-in.",
  applicationName: "ClosedBook",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ClosedBook — Modern Production & Project OS",
    description:
      "A black canvas for production curators and project leads. Direct BYOS sync with your Google Workspace.",
    siteName: "ClosedBook",
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
import { MotionProvider } from "@/components/MotionProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable}`}
      data-theme="signature"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('closebook_theme');if(!t||!['signature','obsidian','indigo','emerald','amber','paper'].includes(t)){t='signature';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-[var(--surface-canvas,#050505)] text-[var(--color-paper,#fdfdfd)] antialiased selection:bg-[var(--color-primary,#FF2A4D)] selection:text-[#ffffff]">
        <PreferencesProvider>
          <MotionProvider>
            {children}
            <PreferencesModal />
          </MotionProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
