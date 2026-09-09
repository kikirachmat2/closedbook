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
    "Zero-budget, user-owned storage management for film crews, creative agencies, and high-velocity projects. Connects seamlessly with your Google Drive & Sheets. Free forever.",
  applicationName: "Closebook",
  authors: [{ name: "Closebook Team" }],
  keywords: [
    "production management",
    "petty cash",
    "film production",
    "call sheet",
    "project management",
    "google drive sync",
    "google sheets sync",
    "closebook",
  ],
  icons: {
    icon: "/quill-icon.jpg",
    apple: "/quill-icon.jpg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Closebook — Modern Production & Project OS",
    description:
      "A black canvas for production curators and project leads. Zero-cost BYOS architecture directly to your Google Workspace.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#050505] text-[#fdfdfd] antialiased selection:bg-[#1500ff] selection:text-[#fdfdfd]">
        {children}
      </body>
    </html>
  );
}
