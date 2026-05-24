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
          "/account/",
          "/account/*",
          "/admin",
          "/admin/",
          "/admin/*",
          "/api",
          "/api/",
          "/api/*",
          "/dashboard",
          "/dashboard/",
          "/create-pet",
          "/create-pet/",
          "/forgot-password",
          "/forgot-password/",
          "/reset-password",
          "/reset-password/",
          "/print",
          "/print/",
          "/print/*",
        ],
      },
    ],
    sitemap: `${brand.domain}/sitemap.xml`,
    host: brand.domain,
  };
}
