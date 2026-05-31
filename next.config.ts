import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/admin/foods/v2-review": [
      "./data/imports/**/*.csv",
      "./data/review/food_v2_import_candidate_queue.csv",
    ],
  },
};

export default nextConfig;
