import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const layout = read("app/layout.tsx");
const reporter = read("app/WebVitalsReporter.tsx");
const route = read("app/api/monitoring/web-vital/route.ts");
const packageJson = read("package.json");

assert(
  layout.includes("<WebVitalsReporter />"),
  "Root layout must mount the web vitals reporter."
);
assert(
  reporter.includes("useReportWebVitals"),
  "Web vitals reporter must use Next.js useReportWebVitals."
);
assert(
  reporter.includes("/api/monitoring/web-vital"),
  "Web vitals reporter must send metrics to the monitoring endpoint."
);
assert(
  reporter.includes("rating === \"good\""),
  "Web vitals reporter must skip good metrics to avoid noisy logs."
);
assert(
  route.includes("web_vital_threshold"),
  "Web vital route must store threshold events."
);
assert(
  route.includes("runtime_monitoring"),
  "Web vital route must use runtime monitoring entity type."
);
assert(
  route.includes("admin_activity_logs"),
  "Web vital route must store events in admin activity logs."
);
assert(
  route.includes("ALLOWED_METRICS"),
  "Web vital route must validate metric names."
);
assert(
  route.includes("ALLOWED_RATINGS"),
  "Web vital route must validate ratings."
);
assert(
  packageJson.includes("\"qa:web-vitals-monitoring-contract\""),
  "package.json must expose the web vitals monitoring QA script."
);
assert(
  packageJson.includes(
    "qa:runtime-error-monitoring-contract && npm run qa:web-vitals-monitoring-contract"
  ),
  "CI readiness must run web vitals monitoring after runtime error monitoring."
);

console.log("Web vitals monitoring contract passed.");
