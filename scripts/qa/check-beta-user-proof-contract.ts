import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type BetaUserProofEntry = {
  label?: string;
  passed?: boolean;
  evidence?: string[];
};

const proofFile =
  process.env.NUTRITAIL_QA_BETA_USER_PROOF_FILE?.trim() ||
  ".qa-secrets/beta-user-proof.json";
const templateFile = "docs/beta-user-proof.template.json";
const reportPath =
  process.env.NUTRITAIL_QA_BETA_USER_REPORT_PATH ||
  "reports/beta_user_proof_qa.md";

const requiredTerms = [
  "signup/login",
  "pet intake",
  "food cards",
  "selected food",
  "grams/day",
  "save",
  "report",
  "feedback",
  "no manual help",
];

const flexibleTermGroups = [
  ["timeline", "progress"],
];

const placeholderPatterns = [
  /\btodo\b/i,
  /replace with real evidence/i,
  /\bplaceholder\b/i,
  /\bdraft\b/i,
  /\bexample\b/i,
];

function read(pathname: string) {
  return readFileSync(pathname, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseProof(raw: string): BetaUserProofEntry[] {
  const parsed = JSON.parse(raw) as { beta_users?: BetaUserProofEntry[] };
  return Array.isArray(parsed.beta_users) ? parsed.beta_users : [];
}

function evaluateEntry(entry: BetaUserProofEntry) {
  const evidence = Array.isArray(entry.evidence) ? entry.evidence.filter(Boolean) : [];
  const evidenceText = evidence.join(" ").toLowerCase();
  const missingRequiredTerms = requiredTerms.filter(
    (term) => !evidenceText.includes(term.toLowerCase()),
  );
  const missingFlexibleGroups = flexibleTermGroups
    .filter((terms) => !terms.some((term) => evidenceText.includes(term)))
    .map((terms) => terms.join(" or "));
  const hasPlaceholderEvidence = evidence.some((note) =>
    placeholderPatterns.some((pattern) => pattern.test(String(note))),
  );
  const ok =
    entry.passed === true &&
    evidence.length > 0 &&
    missingRequiredTerms.length === 0 &&
    missingFlexibleGroups.length === 0 &&
    !hasPlaceholderEvidence;

  return {
    label: entry.label || "unnamed beta user",
    ok,
    evidenceCount: evidence.length,
    missingTerms: [...missingRequiredTerms, ...missingFlexibleGroups],
    hasPlaceholderEvidence,
    note: ok
      ? evidence.slice(0, 2).join("; ")
      : "Needs real beta-user evidence for the complete customer journey.",
  };
}

const docs = read("docs/beta-user-proof.md");
const template = read(templateFile);
const packageJson = read("package.json");
const productProgress = read("docs/product-progress-score.md");
const liveQaPage = read("app/admin/foods/v2-live-qa/page.tsx");

for (const marker of [
  "signup/login",
  "pet intake",
  "food cards",
  "selected food",
  "grams/day",
  "feedback",
]) {
  assert(docs.includes(marker), `Beta user proof doc is missing marker: ${marker}`);
  assert(template.includes(marker), `Beta user proof template is missing marker: ${marker}`);
}

assert(
  docs.includes("Only `PASS` should justify moving Customer UX from 88% toward 90%"),
  "Beta user proof doc must explain when Customer UX can move from 88% toward 90%.",
);

assert(
  packageJson.includes('"qa:beta-user-proof-contract"'),
  "package.json must expose qa:beta-user-proof-contract.",
);

assert(
  packageJson.includes("qa:customer-live-journey-proof && npm run qa:beta-user-proof-contract"),
  "CI readiness must run beta-user proof after customer live journey proof.",
);

assert(
  productProgress.includes("Real beta-user proof") &&
    productProgress.includes("88-90% Customer UX readiness") &&
    productProgress.includes("broader beta-user proof"),
  "Product progress rubric must keep real beta-user proof as the next Customer UX unlock.",
);

assert(
  liveQaPage.includes("Real beta-user proof") &&
    liveQaPage.includes("real beta users can finish the whole nutrition"),
  "Admin live QA page must show real beta-user proof as the next Customer UX unlock.",
);

let proofSource = "missing";
let results: ReturnType<typeof evaluateEntry>[] = [];

if (existsSync(proofFile)) {
  proofSource = proofFile;
  results = parseProof(read(proofFile)).map(evaluateEntry);
}

const passedUsers = results.filter((result) => result.ok);
const reviewUsers = results.filter(
  (result) =>
    result.evidenceCount > 0 &&
    (!result.ok || result.hasPlaceholderEvidence || result.missingTerms.length > 0),
);
const status = passedUsers.length >= 3 ? "PASS" : reviewUsers.length > 0 ? "REVIEW" : "PENDING";

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  [
    "# Beta User Proof QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Status: ${status}`,
    "",
    "This is the evidence gate for moving Customer UX from 88% toward 90%.",
    "It does not replace automated QA; it proves that real beta users can complete the customer journey without manual explanation.",
    "",
    "## Summary",
    "",
    `- Proof source: ${proofSource}`,
    `- Beta users verified: ${passedUsers.length}`,
    `- Beta users needing review: ${reviewUsers.length}`,
    `- Minimum for next score move: 3 complete beta journeys`,
    "",
    "## Required Evidence",
    "",
    "- signup/login",
    "- pet intake",
    "- food cards",
    "- selected food",
    "- grams/day",
    "- save",
    "- report",
    "- timeline or progress",
    "- feedback",
    "- no manual help",
    "",
    "## Beta Users",
    "",
    "| User | Status | Evidence notes | Missing terms |",
    "| --- | --- | --- | --- |",
    ...(results.length > 0
      ? results.map(
          (result) =>
            `| ${result.label} | ${result.ok ? "pass" : "review"} | ${result.note}${result.hasPlaceholderEvidence ? " Placeholder/TODO evidence is not accepted." : ""} | ${result.missingTerms.join(", ") || "-"} |`,
        )
      : [
          "| none yet | pending | Add real beta-user proof to `.qa-secrets/beta-user-proof.json`. | signup/login, pet intake, food cards, selected food, grams/day, save, report, timeline or progress, feedback, no manual help |",
        ]),
    "",
    "## Next Action",
    "",
    status === "PASS"
      ? "Use this report as supporting evidence for the 88-90% Customer UX move."
      : "Collect at least three real beta-user journeys before moving Customer UX above 88%.",
  ].join("\n") + "\n",
  "utf8",
);

console.log(
  JSON.stringify(
    {
      status,
      proofSource,
      betaUsersVerified: passedUsers.length,
      betaUsersNeedingReview: reviewUsers.length,
      report: reportPath,
    },
    null,
    2,
  ),
);
