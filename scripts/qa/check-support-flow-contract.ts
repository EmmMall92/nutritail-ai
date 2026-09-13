import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const supportPage = read("app/support/page.tsx");
const publicHeader = read("components/PublicHeader.tsx");
const sitemap = read("app/sitemap.ts");
const publicLiveRoutes = read("scripts/qa/check-public-launch-live-routes.mjs");
const packageJson = read("package.json");

for (const marker of [
  'title: `Υποστήριξη | ${brand.name}`',
  'path: "/support"',
  'data-testid="support-hero"',
  'data-testid="support-primary-email"',
  'data-testid="support-request-types"',
  'data-testid="support-request-type"',
  'data-testid="support-operating-flow"',
  'data-testid="support-vet-boundary"',
  "Πρόσβαση στον λογαριασμό",
  "Διατροφική ανάλυση ή αναφορά",
  "Στοιχεία τροφής ή προϊόν που λείπει",
  "Απόρρητο ή αίτημα δεδομένων",
  "Κάθε χρήσιμο σχόλιο βελτιώνει την υπηρεσία",
  "Το Nutritail οργανώνει διατροφικές πληροφορίες",
  "γάτα που δυσκολεύεται ή αδυνατεί να ουρήσει",
]) {
  assert(supportPage.includes(marker), `Support page is missing marker: ${marker}`);
}

assert(sitemap.includes('path: "/support"'), "Sitemap must include /support.");

assert(
  publicHeader.includes('href: "/support"') && publicHeader.includes('label: "Υποστήριξη"'),
  "Shared public navigation must link to /support."
);

assert(
  publicLiveRoutes.includes('path: "/support"') &&
    publicLiveRoutes.includes("https://nutritail.ai/support"),
  "Public launch live route smoke must include /support and the sitemap URL."
);

assert(
  packageJson.includes('"qa:support-flow-contract"'),
  "package.json must expose qa:support-flow-contract."
);

assert(
  packageJson.includes(
    "qa:public-trust-copy && npm run qa:gdpr-privacy-contract && npm run qa:legal-readiness-contract && npm run qa:partner-referral-contract && npm run qa:support-flow-contract && npm run qa:launch-recommendation-contract"
  ),
  "CI readiness must run support flow contract after public trust copy."
);

console.log("Support flow contract passed.");
