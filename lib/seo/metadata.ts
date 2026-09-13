import type { Metadata } from "next";

import { brand } from "@/lib/brand";

const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${brand.name} - ενημερωτική επιλογή τροφής για σκύλους και γάτες`,
};

type PublicMetadataInput = {
  title: string;
  description: string;
  path: "/" | `/${string}`;
  index?: boolean;
};

function withBrand(title: string) {
  return title.includes(brand.name) ? title : `${title} | ${brand.name}`;
}

export function createPublicMetadata({
  title,
  description,
  path,
  index = true,
}: PublicMetadataInput): Metadata {
  const fullTitle = withBrand(title);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: brand.name,
      type: "website",
      locale: "el_GR",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
  };
}

export function createNoIndexMetadata(
  title: string,
  description: string,
  path: "/" | `/${string}`
): Metadata {
  const fullTitle = withBrand(title);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    robots: { index: false, follow: false, noarchive: true },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: brand.name,
      type: "website",
      locale: "el_GR",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
  };
}
