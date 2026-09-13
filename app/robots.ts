import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/admin",
          "/api",
          "/dashboard",
          "/create-pet",
          "/print",
        ],
      },
    ],
    sitemap: `${brand.domain}/sitemap.xml`,
    host: brand.domain,
  };
}
