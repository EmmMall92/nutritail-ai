import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const migration = read(
  "supabase/migrations/20260817184520_add_retail_partner_referral_events.sql"
);
const route = read("app/api/account/retail-partner-referrals/route.ts");
const chatbot = read("app/account/chatbot/page.tsx");
const adminRoute = read("app/api/admin/retail-partners/route.ts");
const adminPage = read("app/admin/partners/page.tsx");
const privacyPage = read("app/privacy/page.tsx");
const privacyCenter = read("app/account/privacy/page.tsx");
const privacyConfig = read("lib/privacy/config.ts");
const dataMap = read("docs/privacy-data-map.md");
const agreement = read("docs/partners/partner-agreement-draft-el.md");
const runbook = read("docs/partners/onboarding-runbook-el.md");
const packageJson = read("package.json");

for (const marker of [
  "create table if not exists public.retail_partner_referral_events",
  "references public.retail_partners(id) on delete cascade",
  "references public.retail_partner_product_availability(id) on delete set null",
  "alter table public.retail_partner_referral_events enable row level security",
  "revoke all on table public.retail_partner_referral_events",
  "to service_role",
  "with (security_invoker = true)",
  "nutritail-partner-referral-retention-daily",
  "interval '365 days'",
]) {
  assert(migration.includes(marker), `Referral migration is missing: ${marker}`);
}

const tableDefinition = migration.slice(
  migration.indexOf("create table if not exists public.retail_partner_referral_events"),
  migration.indexOf("create index if not exists retail_partner_referral_partner_occurred_idx")
);

for (const forbiddenColumn of [
  "auth_user_id",
  "customer_id",
  "pet_id",
  "area",
  "ip_address",
  "user_agent",
  "chat_data",
]) {
  assert(
    !tableDefinition.includes(forbiddenColumn),
    `Referral event table must not contain ${forbiddenColumn}.`
  );
}

for (const marker of [
  "requireAccountApiUser()",
  "hasCurrentSubscription(listing)",
  "hasDestination(listing, destination)",
  '.from("retail_partner_referral_events")',
  'source: "chatbot_purchase_options"',
  'return privateJson({ accepted: true }, 202)',
]) {
  assert(route.includes(marker), `Referral API is missing: ${marker}`);
}

for (const forbiddenField of [
  "auth_user_id:",
  "customer_id:",
  "pet_id:",
  "ip_address:",
  "user_agent:",
]) {
  assert(!route.includes(forbiddenField), `Referral API must not write ${forbiddenField}`);
}

for (const marker of [
  "recordFoodPurchaseReferral",
  '"/api/account/retail-partner-referrals"',
  "keepalive: true",
  'option.productUrl ? "product" : "website"',
  'recordFoodPurchaseReferral(option.id, "phone")',
]) {
  assert(chatbot.includes(marker), `Chatbot referral tracking is missing: ${marker}`);
}

assert(
  adminRoute.includes('from("retail_partner_referral_metrics_30d")') &&
    adminRoute.includes("referrals30d"),
  "Partner admin API must return rolling referral metrics."
);

for (const marker of [
  'data-testid="partner-referral-metrics"',
  "Anonymous referrals",
  "not proof of a sale",
  "Referrals (30d)",
]) {
  assert(adminPage.includes(marker), `Partner admin metrics are missing: ${marker}`);
}

assert(
  privacyConfig.includes("partnerReferralDays: 365") &&
    privacyPage.includes("ανώνυμο event") &&
    privacyCenter.includes("Ανώνυμες παραπομπές καταστημάτων") &&
    dataMap.includes("Partner referral measurement"),
  "Privacy notices and data map must describe referral retention and minimisation."
);

for (const marker of [
  "Ανεξαρτησία διατροφικής πρότασης",
  "Χορηγούμενη εμφάνιση",
  "Μετρήσεις και πρόσβαση σε δεδομένα",
  "Δεν παρέχονται στον Συνεργάτη",
  "15 ημέρες",
]) {
  assert(agreement.includes(marker), `Partner agreement draft is missing: ${marker}`);
}

for (const marker of [
  "Προέλεγχος επιχείρησης",
  "QA πριν το go-live",
  "Κανόνες χρήσης metrics",
  "δεν περιέχει customer, pet, περιοχή, IP ή chat data",
]) {
  assert(runbook.includes(marker), `Partner onboarding runbook is missing: ${marker}`);
}

assert(
  packageJson.includes('"qa:partner-referral-contract"'),
  "package.json must expose qa:partner-referral-contract."
);

console.log(
  "Partner referral contract passed: anonymous event schema, retention, validated targets, admin metrics, disclosures, and onboarding controls are intact."
);
