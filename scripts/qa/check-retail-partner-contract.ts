import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const adminPage = read("app/admin/partners/page.tsx");
const adminLayout = read("app/admin/layout.tsx");
const partnerRoute = read("app/api/admin/retail-partners/route.ts");
const partnerItemRoute = read("app/api/admin/retail-partners/[id]/route.ts");
const listingRoute = read(
  "app/api/admin/retail-partners/[id]/availability/route.ts"
);
const listingItemRoute = read(
  "app/api/admin/retail-partners/[id]/availability/[availabilityId]/route.ts"
);
const customerRoute = read("app/api/account/foods/availability/route.ts");
const ranking = read("lib/retail-partners/ranking.ts");
const chatbotPage = read("app/account/chatbot/page.tsx");
const rankingPage = read("app/store-ranking/page.tsx");
const migration = read("supabase/migrations/retail_partner_availability.sql");
const packageJson = read("package.json");

for (const [name, source] of [
  ["partner collection", partnerRoute],
  ["partner item", partnerItemRoute],
  ["listing collection", listingRoute],
  ["listing item", listingItemRoute],
] as const) {
  assert(
    source.includes("requireAdminOnlyApiAccess"),
    `${name} route must require the admin role.`
  );
}

for (const marker of [
  'data-testid="retail-partners-admin-page"',
  "New retail partner",
  "Search Food V2",
  "Sponsored placement",
  "Visible to customers",
  "Mark verified",
]) {
  assert(adminPage.includes(marker), `Admin partner page is missing: ${marker}`);
}

assert(
  adminLayout.includes('{ href: "/admin/partners", label: "Partners" }'),
  "Admin-only navigation must expose the Partners page."
);
assert(
  customerRoute.includes(
    '.in("partner.subscription_status", ["active", "trial"])'
  ),
  "Customer availability must only include active or trial partners."
);
assert(
  customerRoute.includes("rankEligiblePartnerAvailability"),
  "Customer availability must use the isolated partner-ranking module."
);
assert(
  customerRoute.includes('.eq("food_product_id", foodProductId)'),
  "Customer availability must start from the exact selected food product."
);
assert(
  !customerRoute.includes("recommendFood") &&
    !ranking.includes("food-v2/recommend") &&
    ranking.includes("const bySponsorship"),
  "Commercial ranking must remain separate from nutrition recommendation code."
);

for (const marker of [
  "Συνεργαζόμενο κατάστημα",
  "Χορηγούμενη εμφάνιση",
  'href="/store-ranking"',
]) {
  assert(chatbotPage.includes(marker), `Chatbot store disclosure is missing: ${marker}`);
}

for (const marker of [
  'data-testid="store-ranking-policy-page"',
  'data-testid="store-ranking-paid-effect"',
  "Δεν μπορεί να αγοράσει",
  "δηλωμένη διαχειριστική προτεραιότητα",
]) {
  assert(rankingPage.includes(marker), `Store-ranking policy is missing: ${marker}`);
}

for (const marker of [
  "alter table retail_partners enable row level security",
  "alter table retail_partner_product_availability enable row level security",
  "revoke all on table retail_partners from anon, authenticated",
  "grant select, insert, update, delete on table retail_partners to service_role",
]) {
  assert(migration.includes(marker), `Retail partner migration is missing: ${marker}`);
}

assert(
  packageJson.includes('"qa:retail-partner-contract"'),
  "package.json must expose qa:retail-partner-contract."
);

console.log(
  "Retail partner contract passed: admin access, subscriptions, listings, disclosure ordering, and database permissions are intact."
);
