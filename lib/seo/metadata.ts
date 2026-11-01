import type { Metadata } from "next";

import { brand } from "@/lib/brand";
import {
  localizePath,
  openGraphLocale,
  type Locale,
} from "@/lib/i18n/config";

function socialImage(locale: Locale) {
  return {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt:
      locale === "el"
        ? `${brand.name} - ενημερωτική επιλογή τροφής για σκύλους και γάτες`
        : `${brand.name} - informational food guidance for dogs and cats`,
  };
}

type PublicMetadataInput = {
  title: string;
  description: string;
  path: "/" | `/${string}`;
  index?: boolean;
  locale?: Locale;
};

function withBrand(title: string) {
  return title.includes(brand.name) ? title : `${title} | ${brand.name}`;
}

export function createPublicMetadata({
  title,
  description,
  path,
  index = true,
  locale = "el",
}: PublicMetadataInput): Metadata {
  const fullTitle = withBrand(title);
  const canonicalPath = localizePath(path, locale);

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "el-GR": localizePath(path, "el"),
        en: localizePath(path, "en"),
        "x-default": localizePath(path, "el"),
      },
    },
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
      url: canonicalPath,
      siteName: brand.name,
      type: "website",
      locale: openGraphLocale(locale),
      alternateLocale: [openGraphLocale(locale === "el" ? "en" : "el")],
      images: [socialImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage(locale)],
    },
  };
}

export function createNoIndexMetadata(
  title: string,
  description: string,
  path: "/" | `/${string}`,
  locale: Locale = "el"
): Metadata {
  const fullTitle = withBrand(title);
  const canonicalPath = localizePath(path, locale);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: false, follow: false, noarchive: true },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalPath,
      siteName: brand.name,
      type: "website",
      locale: openGraphLocale(locale),
      images: [socialImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage(locale)],
    },
  };
}
