import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { brand } from "@/lib/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { WebVitalsReporter } from "./WebVitalsReporter";

const inter = Inter({
  subsets: ["greek", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  ...createPublicMetadata({
    title: brand.name,
    description: brand.description,
    path: "/",
  }),
  applicationName: brand.name,
  metadataBase: new URL(brand.domain),
  keywords: [
    "τροφή σκύλου",
    "τροφή γάτας",
    "υπολογισμός θερμίδων σκύλου",
    "υπολογισμός θερμίδων γάτας",
    "ημερήσια μερίδα κατοικιδίου",
    "διατροφική καθοδήγηση κατοικιδίων",
  ],
  authors: [{ name: brand.businessName }],
  creator: brand.businessName,
  publisher: brand.businessName,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/nutritail-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
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
    <html lang="el">
      <body className={inter.variable}>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
