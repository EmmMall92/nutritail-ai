import { brand } from "@/lib/brand";

type GuideStructuredDataInput = {
  title: string;
  description: string;
  path: `/guides/${string}`;
  datePublished: `${number}-${number}-${number}`;
  dateModified: `${number}-${number}-${number}`;
};

export function createGuideStructuredData({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: GuideStructuredDataInput) {
  const url = `${brand.domain}${path}`;

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
        inLanguage: "el-GR",
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
            name: "Αρχική",
            item: brand.domain,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Οδηγοί διατροφής",
            item: `${brand.domain}/guides`,
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
