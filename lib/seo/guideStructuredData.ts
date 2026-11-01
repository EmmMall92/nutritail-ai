import { brand } from "@/lib/brand";
import { localizePath, localeTag, type Locale } from "@/lib/i18n/config";

type GuideStructuredDataInput = {
  title: string;
  description: string;
  path: `/guides/${string}`;
  datePublished: `${number}-${number}-${number}`;
  dateModified: `${number}-${number}-${number}`;
  locale?: Locale;
};

export function createGuideStructuredData({
  title,
  description,
  path,
  datePublished,
  dateModified,
  locale = "el",
}: GuideStructuredDataInput) {
  const localizedPath = localizePath(path, locale);
  const url = `${brand.domain}${localizedPath}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: title,
        description,
        url,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        inLanguage: localeTag(locale),
        datePublished,
        dateModified,
        image: {
          "@type": "ImageObject",
          url: `${brand.domain}/opengraph-image`,
          width: 1200,
          height: 630,
        },
        author: {
          "@type": "Organization",
          name: brand.businessName,
          url: brand.domain,
        },
        publisher: {
          "@type": "Organization",
          name: brand.businessName,
          url: brand.domain,
          logo: {
            "@type": "ImageObject",
            url: `${brand.domain}/icon-512.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: locale === "el" ? "Αρχική" : "Home",
            item: `${brand.domain}${localizePath("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: locale === "el" ? "Οδηγοί διατροφής" : "Nutrition guides",
            item: `${brand.domain}${localizePath("/guides", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: url,
          },
        ],
      },
    ],
  };
}
