import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { brand } from "@/lib/brand";
import { getRequestLocale } from "@/lib/i18n/server";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { WebVitalsReporter } from "./WebVitalsReporter";

const inter = Inter({
  subsets: ["greek", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const description =
    locale === "el"
      ? brand.description
      : "Informational food guidance, calorie estimates and practical portions for dogs and cats.";

  return {
    ...createPublicMetadata({
      title: brand.name,
      description,
      path: "/",
      locale,
    }),
    applicationName: brand.name,
    metadataBase: new URL(brand.domain),
    keywords:
      locale === "el"
        ? [
            "τροφή σκύλου",
            "τροφή γάτας",
            "υπολογισμός θερμίδων σκύλου",
            "υπολογισμός θερμίδων γάτας",
            "ημερήσια μερίδα κατοικιδίου",
            "διατροφική καθοδήγηση κατοικιδίων",
          ]
        : [
            "dog food",
            "cat food",
            "dog calorie calculator",
            "cat calorie calculator",
            "daily pet food portion",
            "pet nutrition guidance",
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
}

export const viewport: Viewport = {
  themeColor: brand.colors.accent,
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body className={inter.variable}>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
