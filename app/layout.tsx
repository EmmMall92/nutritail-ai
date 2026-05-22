import type { Metadata } from "next";
import "./globals.css";

import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  metadataBase: new URL(brand.domain),

  openGraph: {
    title: brand.name,
    description: brand.description,
    url: brand.domain,
    siteName: brand.name,
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
  },
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