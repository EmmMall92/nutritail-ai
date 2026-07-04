import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
  {
    path: "/about",
    priority: 0.7,
  },
  {
    path: "/privacy",
    priority: 0.3,
  },
  {
    path: "/how-it-works",
    priority: 0.7,
  },
  {
    path: "/beta",
    priority: 0.6,
  },
  {
    path: "/plans",
    priority: 0.6,
  },
  {
    path: "/support",
    priority: 0.5,
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
