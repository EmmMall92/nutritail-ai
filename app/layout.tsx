import type { Metadata, Viewport } from "next";
import "./globals.css";

import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  applicationName: brand.name,
  metadataBase: new URL(brand.domain),
  keywords: [
    "pet nutrition",
    "dog food calculator",
    "cat food calculator",
    "pet calorie calculator",
    "AI pet nutrition",
  ],
  authors: [{ name: brand.businessName }],
  creator: brand.businessName,
  publisher: brand.businessName,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: brand.name,
    description: brand.description,
    url: brand.domain,
    siteName: brand.name,
    type: "website",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.accent,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
