import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
  {
    path: "/chatbot",
    priority: 0.7,
  },
  {
    path: "/privacy",
    priority: 0.3,
  },
  {
    path: "/terms",
    priority: 0.3,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${brand.domain}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
