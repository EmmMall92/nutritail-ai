import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { launchFeatures } from "@/lib/launch/features";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/how-it-works",
    changeFrequency: "monthly",
    priority: 0.8,
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
  return publicRoutes.map((route) => ({
    url: `${brand.domain}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
