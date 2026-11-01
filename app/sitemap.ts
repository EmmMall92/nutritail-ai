import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { launchFeatures } from "@/lib/launch/features";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
    lastModified: "2026-11-01",
  },
  {
    path: "/how-it-works",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/choosing-dog-food",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/dog-food-portion",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/choosing-cat-food",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/cat-food-portion",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/changing-pet-food",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/guides/can-dogs-eat-cat-food",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-01",
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  ...(launchFeatures.betaWaitlist
    ? [{ path: "/beta", changeFrequency: "weekly" as const, priority: 0.6 }]
    : []),
  ...(launchFeatures.paidPlans
    ? [{ path: "/plans", changeFrequency: "monthly" as const, priority: 0.6 }]
    : []),
  {
    path: "/support",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/ai-transparency",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.3,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const locales: Locale[] = ["el", "en"];

  return publicRoutes.flatMap((route) => {
    const languages = {
      "el-GR": `${brand.domain}${localizePath(route.path, "el")}`,
      en: `${brand.domain}${localizePath(route.path, "en")}`,
      "x-default": `${brand.domain}${localizePath(route.path, "el")}`,
    };

    return locales.map((locale) => ({
      url: `${brand.domain}${localizePath(route.path, locale)}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages },
      ...("lastModified" in route ? { lastModified: route.lastModified } : {}),
    }));
  });
}
