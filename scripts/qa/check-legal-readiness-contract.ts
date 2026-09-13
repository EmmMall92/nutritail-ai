import { readFileSync } from "node:fs";

import {
  rankEligiblePartnerAvailability,
  type PartnerAvailabilityRow,
} from "../../lib/retail-partners/ranking";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const migration = read(
  "supabase/migrations/20260817182432_add_customer_legal_acceptances.sql"
);
const termsVersionMigration = read(
  "supabase/migrations/20260817213000_update_terms_acceptance_version.sql"
);
const legalConfig = read("lib/legal/config.ts");
const privacyConfig = read("lib/privacy/config.ts");
const registerPage = read("app/register/page.tsx");
const exportRoute = read("app/api/account/privacy/export/route.ts");
const deleteRoute = read("app/api/account/privacy/delete/route.ts");
const chatbotPage = read("app/account/chatbot/page.tsx");
const aiPage = read("app/ai-transparency/page.tsx");
const rankingPage = read("app/store-ranking/page.tsx");
const availabilityRoute = read("app/api/account/foods/availability/route.ts");
const termsPage = read("app/terms/page.tsx");
const footer = read("components/PublicFooter.tsx");
const packageJson = read("package.json");
const acceptanceRoute = read("app/api/account/legal-acceptance/route.ts");
const acceptanceGate = read("components/LegalAcceptanceGate.tsx");

for (const marker of [
  "create table if not exists public.customer_legal_acceptances",
  "references auth.users(id) on delete cascade",
  "unique (auth_user_id, document_type, document_version)",
  "alter table public.customer_legal_acceptances enable row level security",
  "revoke all on table public.customer_legal_acceptances",
  "to service_role",
  "create trigger on_auth_user_created_capture_legal_acceptances",
  "after insert on auth.users",
  "set search_path = ''",
]) {
  assert(migration.includes(marker), `Legal acceptance migration is missing: ${marker}`);
}

assert(
  legalConfig.includes('TERMS_VERSION = "2026-08-17.2"') &&
    privacyConfig.includes('PRIVACY_POLICY_VERSION = "2026-08-17"'),
  "Terms and Privacy Notice versions must be explicit and current."
);

assert(
  termsVersionMigration.includes("terms_version' = '2026-08-17.2'") &&
    termsVersionMigration.includes("'2026-08-17.2'") &&
    termsVersionMigration.includes("set search_path = ''"),
  "The registration trigger must capture the current Terms version."
);

for (const marker of [
  '.eq("document_version", TERMS_VERSION)',
  'source: "reacceptance"',
  'body?.accepted !== true',
]) {
  assert(acceptanceRoute.includes(marker), `Terms reacceptance API is missing: ${marker}`);
}

for (const marker of [
  'data-testid="legal-acceptance-gate"',
  "Αποδοχή και συνέχεια",
  'href="/account/privacy"',
]) {
  assert(acceptanceGate.includes(marker), `Terms reacceptance gate is missing: ${marker}`);
}

for (const marker of [
  'data-testid="registration-legal-acceptance"',
  'id="terms-accepted"',
  "required",
  "terms_accepted: true",
  "terms_version: TERMS_VERSION",
  "privacy_notice_acknowledged: true",
  "privacy_notice_version: PRIVACY_POLICY_VERSION",
  "legal_acceptance_source: REGISTRATION_LEGAL_SOURCE",
]) {
  assert(registerPage.includes(marker), `Registration legal gate is missing: ${marker}`);
}

assert(
  exportRoute.includes("legalAcceptances") &&
    exportRoute.includes('.from("customer_legal_acceptances")'),
  "Privacy export must include legal acceptance evidence."
);
assert(
  deleteRoute.includes('.from("customer_legal_acceptances")') &&
    migration.includes("on delete cascade"),
  "Account erasure must remove legal acceptance evidence."
);

for (const marker of [
  'data-testid="chatbot-ai-transparency-notice"',
  "Συνομιλείς με σύστημα AI",
  'href="/ai-transparency"',
]) {
  assert(chatbotPage.includes(marker), `Chatbot AI notice is missing: ${marker}`);
}

for (const marker of [
  'data-testid="ai-transparency-page"',
  "σύστημα AI",
  "δεν αντικαθιστά κτηνίατρο",
  "Εμπορικός διαχωρισμός",
]) {
  assert(aiPage.includes(marker), `AI transparency page is missing: ${marker}`);
}

for (const marker of [
  'data-testid="store-ranking-policy-page"',
  'data-testid="store-ranking-paid-effect"',
  "Χορηγούμενη εμφάνιση",
  "Δεν παραδίδουμε στα καταστήματα",
]) {
  assert(rankingPage.includes(marker), `Store-ranking page is missing: ${marker}`);
}

assert(
  availabilityRoute.includes('.eq("food_product_id", foodProductId)') &&
    availabilityRoute.includes("rankEligiblePartnerAvailability") &&
    !availabilityRoute.includes("recommendationEngine"),
  "Store ranking must consume an already selected food without entering nutrition ranking."
);

for (const marker of [
  "AI και αυτοματοποιημένη καθοδήγηση",
  "Επαγγελματική ιδιότητα και επιστημονικός έλεγχος",
  "medical handoff χωρίς κατάταξη προϊόντων, θερμίδες ή γραμμάρια",
  "Συνεργαζόμενα καταστήματα και κατάταξη",
  "θα ζητάμε νέα ρητή αποδοχή συγκεκριμένης έκδοσης",
  "TERMS_VERSION",
]) {
  assert(termsPage.includes(marker), `Terms page is missing: ${marker}`);
}

assert(
  footer.includes('/ai-transparency') && footer.includes('/store-ranking'),
  "Public footer must expose both transparency policies."
);

function row({
  id,
  channel,
  city,
  availability,
  sponsored,
  status = "active",
  expiresAt = "2026-12-31",
}: {
  id: string;
  channel: "local_store" | "online" | "both";
  city: string | null;
  availability: "in_stock" | "order_available" | "unknown";
  sponsored: boolean;
  status?: string;
  expiresAt?: string | null;
}): PartnerAvailabilityRow {
  return {
    id,
    channel,
    availability_status: availability,
    product_url: null,
    estimated_price_euro: null,
    is_sponsored: sponsored,
    display_priority: 100,
    partner: {
      id: `partner-${id}`,
      name: `Store ${id}`,
      city,
      area: null,
      postal_code: null,
      address: null,
      website_url: null,
      phone: null,
      channel,
      subscription_status: status,
      subscription_expires_at: expiresAt,
    },
  };
}

const ranked = rankEligiblePartnerAvailability(
  [
    row({ id: "online-sponsored", channel: "online", city: null, availability: "in_stock", sponsored: true }),
    row({ id: "athens-local", channel: "local_store", city: "Αθήνα", availability: "in_stock", sponsored: false }),
    row({ id: "online-organic", channel: "online", city: null, availability: "in_stock", sponsored: false }),
    row({ id: "expired", channel: "online", city: null, availability: "in_stock", sponsored: true, expiresAt: "2025-01-01" }),
    row({ id: "patras-local", channel: "local_store", city: "Πάτρα", availability: "in_stock", sponsored: true }),
  ],
  { area: "Αθηνα", today: "2026-08-17" }
);

assert(ranked[0]?.id === "athens-local", "A relevant local store must rank before online listings.");
assert(ranked[1]?.id === "online-sponsored", "Sponsorship may rank within the same eligible location and availability tier.");
assert(!ranked.some((item) => item.id === "expired"), "Expired partners must be excluded.");
assert(!ranked.some((item) => item.id === "patras-local"), "Irrelevant local stores must be excluded from an area search.");

assert(
  packageJson.includes('"qa:legal-readiness-contract"'),
  "package.json must expose qa:legal-readiness-contract."
);

console.log(
  "Legal readiness contract passed: versioned registration and reacceptance evidence, medical boundaries, AI disclosure, commercial separation, ranking labels, and GDPR lifecycle coverage are intact."
);
