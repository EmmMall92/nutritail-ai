import type { NextConfig } from "next";

const noIndexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

const noIndexRoutes = [
  "/account/:path*",
  "/admin/:path*",
  "/api/:path*",
  "/print/:path*",
  "/chatbot",
  "/dashboard",
  "/create-pet",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const nextConfig: NextConfig = {
  async headers() {
    return noIndexRoutes.map((source) => ({
      source,
      headers: noIndexHeaders,
    }));
  },
  outputFileTracingIncludes: {
    "/api/admin/foods/v2-review": [
      "./data/imports/**/*.csv",
      "./data/review/food_v2_import_candidate_queue.csv",
    ],
  },
};

export default nextConfig;
