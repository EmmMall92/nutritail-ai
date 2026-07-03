import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const appError = read("app/error.tsx");
const globalError = read("app/global-error.tsx");
const monitoringRoute = read("app/api/monitoring/client-error/route.ts");
const adminActivityPage = read("app/admin/activity/page.tsx");
const packageJson = read("package.json");
const runtimeErrorQaIndex = packageJson.indexOf("qa:runtime-error-monitoring-contract");
const chatbotTrainingQaIndex = packageJson.indexOf("qa:openai-chatbot-training-contract");

for (const source of [appError, globalError]) {
  assert(
    source.includes("/api/monitoring/client-error"),
    "Error boundaries must report client runtime errors."
  );
  assert(
    source.includes("Δοκίμασε ξανά"),
    "Error boundaries must offer a retry action."
  );
  assert(
    source.includes("Αρχική"),
    "Error boundaries must offer a home fallback."
  );
}

assert(
  globalError.includes("<html lang=\"el\">"),
  "Global error boundary must render the required html wrapper."
);
assert(
  monitoringRoute.includes("client_runtime_error"),
  "Monitoring route must store client runtime error actions."
);
assert(
  monitoringRoute.includes("runtime_monitoring"),
  "Monitoring route must use a runtime monitoring entity type."
);
assert(
  monitoringRoute.includes("admin_activity_logs"),
  "Monitoring route must store events in admin activity logs."
);
assert(
  monitoringRoute.includes("MAX_TEXT_LENGTH"),
  "Monitoring route must truncate incoming error text."
);
assert(
  adminActivityPage.includes("function isRuntimeMonitoringLog") &&
    adminActivityPage.includes("function isClientRuntimeError") &&
    adminActivityPage.includes("function isWebVitalThreshold") &&
    adminActivityPage.includes('data-testid="admin-runtime-monitoring-board"') &&
    adminActivityPage.includes('data-testid="admin-runtime-monitoring-paths"') &&
    adminActivityPage.includes("Runtime monitoring") &&
    adminActivityPage.includes("Runtime errors") &&
    adminActivityPage.includes("Web Vital warnings") &&
    adminActivityPage.includes("Affected paths") &&
    adminActivityPage.includes("Next launch action") &&
    adminActivityPage.includes("qa:live-readiness-deploy-freshness"),
  "Admin activity must expose runtime monitoring and Web Vital launch signals."
);
assert(
  packageJson.includes("\"qa:runtime-error-monitoring-contract\""),
  "package.json must expose the runtime error monitoring QA script."
);
assert(
  runtimeErrorQaIndex >= 0 &&
    chatbotTrainingQaIndex >= 0 &&
    runtimeErrorQaIndex < chatbotTrainingQaIndex,
  "CI readiness must run runtime error monitoring before chatbot contracts."
);

console.log("Runtime error monitoring contract passed.");
