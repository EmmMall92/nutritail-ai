import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const migration = read(
  "supabase/migrations/20260810191620_add_customer_privacy_controls.sql"
);
const config = read("lib/privacy/config.ts");
const preferencesRoute = read(
  "app/api/account/privacy/preferences/route.ts"
);
const exportRoute = read("app/api/account/privacy/export/route.ts");
const deleteRoute = read("app/api/account/privacy/delete/route.ts");
const privacyCenter = read("app/account/privacy/page.tsx");
const privacyPolicy = read("app/privacy/page.tsx");
const accountLayout = read("app/account/layout.tsx");
const privacyDataMap = read("docs/privacy-data-map.md");
const packageJson = read("package.json");

for (const table of [
  "customer_privacy_preferences",
  "customer_consent_events",
]) {
  assert(
    migration.includes(`create table if not exists public.${table}`),
    `${table} must be created by the GDPR migration.`
  );
  assert(
    migration.includes(`alter table public.${table} enable row level security;`),
    `${table} must have RLS enabled.`
  );
  assert(
    migration.includes(
      `revoke all on table public.${table}`
    ),
    `${table} must revoke browser-facing grants.`
  );
}

for (const marker of [
  "references auth.users(id) on delete cascade",
  "customer_consent_events_user_created_idx",
  "create extension if not exists pg_cron",
  "nutritail-privacy-retention-daily",
  "entity_type = 'runtime_monitoring'",
  "interval '90 days'",
  "entity_type = 'chatbot_feedback'",
  "interval '365 days'",
]) {
  assert(migration.includes(marker), `GDPR migration is missing: ${marker}`);
}

for (const marker of [
  'PRIVACY_POLICY_VERSION = "2026-08-17"',
  "runtimeMonitoringDays: 90",
  "chatbotFeedbackDays: 365",
  "productAnalyticsEnabled: false",
  "partnerOffersEnabled: false",
]) {
  assert(config.includes(marker), `Privacy config is missing: ${marker}`);
}

for (const marker of [
  "requireAccountApiUser",
  'from("customer_privacy_preferences")',
  'from("customer_consent_events")',
  "product_analytics",
  "partner_offers",
  "Cache-Control",
]) {
  assert(
    preferencesRoute.includes(marker),
    `Privacy preferences API is missing: ${marker}`
  );
}

for (const marker of [
  "requireAccountApiUser",
  'from("customers")',
  'from("pets")',
  'from("pet_analyses")',
  'from("customer_consent_events")',
  'from("admin_activity_logs")',
  'eq("metadata->>email", accountEmail)',
  "Content-Disposition",
  "application/json",
]) {
  assert(exportRoute.includes(marker), `Privacy export is missing: ${marker}`);
}

for (const marker of [
  "requireAccountApiUser",
  'const DELETE_CONFIRMATION = "ΔΙΑΓΡΑΦΗ"',
  'from("admin_activity_logs")',
  'from("pet_analyses")',
  'from("pets")',
  'from("customers")',
  'from("profiles")',
  'eq("metadata->>email", accountEmail)',
  "supabaseAdmin.auth.admin.deleteUser",
]) {
  assert(deleteRoute.includes(marker), `Account erasure is missing: ${marker}`);
}

for (const marker of [
  'data-testid="account-privacy-center"',
  'role="switch"',
  "Λήψη δεδομένων",
  "Οριστική διαγραφή",
  "Cookies και περιοχή",
  "δεν αποθηκεύεται στο προφίλ σου",
]) {
  assert(privacyCenter.includes(marker), `Privacy Center is missing: ${marker}`);
}

for (const marker of [
  "Σκοποί και νομικές βάσεις",
  "Τα δικαιώματά σου",
  "Cookies, περιοχή και συνεργαζόμενα καταστήματα",
  "Supabase",
  "Vercel",
  "OpenAI",
  "Ελληνική Αρχή Προστασίας Δεδομένων",
]) {
  assert(privacyPolicy.includes(marker), `Privacy policy is missing: ${marker}`);
}

assert(
  accountLayout.includes('{ href: "/account/privacy", label: "Απόρρητο"'),
  "Account navigation must expose the Privacy Center."
);
assert(
  packageJson.includes('"qa:gdpr-privacy-contract"'),
  "package.json must expose qa:gdpr-privacy-contract."
);

for (const marker of [
  "## Processing activities",
  "## Customer controls",
  "## Incident response baseline",
  "## Pre-launch legal and operational confirmations",
  "Optional consent starts disabled",
]) {
  assert(privacyDataMap.includes(marker), `Privacy data map is missing: ${marker}`);
}

console.log(
  "GDPR privacy contract passed: consent, retention, export, erasure, and customer controls are intact."
);
