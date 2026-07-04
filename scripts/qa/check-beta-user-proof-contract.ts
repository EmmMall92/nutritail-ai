import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type BetaUserProofEntry = {
  label?: string;
  journey_type?: string;
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
  "device captured",
];

const flexibleTermGroups = [
  ["timeline", "progress"],
];

const requiredJourneyTypes = [
  {
    type: "dog_owner",
    label: "dog owner journey",
    aliases: ["dog", "dog owner", "σκυλος", "σκύλος", "σκυλι", "σκύλι"],
  },
  {
    type: "cat_owner",
    label: "cat owner journey",
    aliases: ["cat", "cat owner", "γατα", "γάτα", "γατι", "γατί"],
  },
  {
    type: "returning_saved_pet",
    label: "returning saved-pet journey",
    aliases: ["returning", "saved pet", "progress", "timeline", "ξανα", "προοδο", "πρόοδο"],
  },
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
  const journeyText = `${entry.journey_type ?? ""} ${entry.label ?? ""} ${evidenceText}`.toLowerCase();
  const journeyType =
    requiredJourneyTypes.find(
      (journey) =>
        entry.journey_type === journey.type ||
        journey.aliases.some((alias) => journeyText.includes(alias)),
    )?.type ?? "unknown";
  const missingRequiredTerms = requiredTerms.filter(
    (term) => !evidenceText.includes(term.toLowerCase()),
  );
  const missingFlexibleGroups = flexibleTermGroups
    .filter((terms) => !terms.some((term) => evidenceText.includes(term)))
    .map((terms) => terms.join(" or "));
  const hasPlaceholderEvidence = evidence.some((note) =>
    placeholderPatterns.some((pattern) => pattern.test(String(note))),
  );
  const device =
    evidenceText.includes("mobile") || evidenceText.includes("κινητ")
      ? "mobile"
      : evidenceText.includes("desktop")
        ? "desktop"
        : "unknown";
  const ok =
    entry.passed === true &&
    journeyType !== "unknown" &&
    evidence.length > 0 &&
    missingRequiredTerms.length === 0 &&
    missingFlexibleGroups.length === 0 &&
    !hasPlaceholderEvidence;

  return {
    label: entry.label || "unnamed beta user",
    ok,
    journeyType,
    device,
    evidenceCount: evidence.length,
    missingTerms: [...missingRequiredTerms, ...missingFlexibleGroups],
    hasPlaceholderEvidence,
    note: ok
      ? evidence.slice(0, 2).join("; ")
      : "Needs real beta-user evidence for the complete customer journey.",
  };
}

const docs = read("docs/beta-user-proof.md");
const testCard = read("docs/beta-user-test-card.md");
const sessionPlaybook = read("docs/beta-user-session-playbook.md");
const sessionPacket = read("docs/beta-user-proof-session-packet.md");
const worksheet = read("docs/beta-user-proof-worksheet.md");
const template = read(templateFile);
const packageJson = read("package.json");
const productProgress = read("docs/product-progress-score.md");
const liveQaPage = read("app/admin/foods/v2-live-qa/page.tsx");
const adminActivityPage = read("app/admin/activity/page.tsx");

for (const marker of [
  "signup/login",
  "pet intake",
  "food cards",
  "selected food",
  "grams/day",
  "feedback",
]) {
  assert(docs.includes(marker), `Beta user proof doc is missing marker: ${marker}`);
  assert(testCard.includes(marker), `Beta user test card is missing marker: ${marker}`);
  assert(
    sessionPlaybook.includes(marker),
    `Beta user session playbook is missing marker: ${marker}`,
  );
  assert(
    sessionPacket.includes(marker),
    `Beta user proof session packet is missing marker: ${marker}`,
  );
  assert(
    worksheet.includes(marker),
    `Beta user proof worksheet is missing marker: ${marker}`,
  );
  assert(template.includes(marker), `Beta user proof template is missing marker: ${marker}`);
}

for (const marker of ["device captured", "mobile", "desktop"]) {
  assert(docs.includes(marker), `Beta user proof doc is missing device marker: ${marker}`);
  assert(testCard.includes(marker), `Beta user test card is missing device marker: ${marker}`);
  assert(
    sessionPacket.includes(marker),
    `Beta user proof session packet is missing device marker: ${marker}`,
  );
  assert(
    worksheet.includes(marker),
    `Beta user proof worksheet is missing device marker: ${marker}`,
  );
  assert(template.includes(marker), `Beta user proof template is missing device marker: ${marker}`);
}

for (const journey of requiredJourneyTypes) {
  assert(docs.includes(journey.type), `Beta user proof doc is missing journey type: ${journey.type}`);
  assert(
    testCard.includes(journey.label),
    `Beta user test card is missing journey label: ${journey.label}`,
  );
  assert(
    template.includes(`"journey_type": "${journey.type}"`),
    `Beta user proof template is missing journey type: ${journey.type}`,
  );
  assert(
    sessionPacket.includes(journey.label),
    `Beta user proof session packet is missing journey label: ${journey.label}`,
  );
}

assert(
  docs.includes("Only `PASS` should justify moving Customer UX from 88% toward 90%"),
  "Beta user proof doc must explain when Customer UX can move from 88% toward 90%.",
);

assert(
  docs.includes("docs/beta-user-test-card.md") &&
    docs.includes("docs/beta-user-session-playbook.md") &&
    testCard.includes("What The Tester Should Do") &&
    testCard.includes("without a developer, admin, or pet-shop expert") &&
    testCard.includes("Good evidence note") &&
    testCard.includes("Weak evidence note") &&
    testCard.includes("Only a `PASS` result should justify moving Customer UX readiness from 88%"),
  "Beta user proof docs must include a practical test card for collecting real beta-user evidence.",
);

assert(
  sessionPlaybook.includes("Moderator Rules") &&
    sessionPlaybook.includes("not guide the product") &&
    sessionPlaybook.includes("Decision After Each Session") &&
    sessionPlaybook.includes("final chatbot experience") &&
    sessionPlaybook.includes("food recommendation accuracy") &&
    sessionPlaybook.includes("business layer") &&
    sessionPlaybook.includes("Only `qa:beta-user-proof-contract` returning `PASS` should justify moving") &&
    productProgress.includes("docs/beta-user-session-playbook.md"),
  "Beta user session playbook must define moderator rules, outcomes, launch-track follow-up, and the score rule.",
);

assert(
  docs.includes("docs/beta-user-proof-session-packet.md") &&
    sessionPacket.includes("Beta User Proof Session Packet") &&
    sessionPacket.includes("Evidence Note Template") &&
    sessionPacket.includes("Pass Rule") &&
    sessionPacket.includes("Copy-Item docs/beta-user-proof.template.json") &&
    sessionPacket.includes("npm.cmd run qa:beta-user-proof-contract"),
  "Beta user proof docs must include a quick session packet with the exact evidence note and commands.",
);

assert(
  docs.includes("docs/beta-user-proof-worksheet.md") &&
    docs.includes("PASS`, `REVIEW`, or `FAIL`") &&
    docs.includes("ten launch tracks") &&
    docs.includes("Do not move the percentage") &&
    worksheet.includes("Beta User Proof Worksheet") &&
    worksheet.includes("Score-Safe Decision") &&
    worksheet.includes("Do not move the percentage") &&
    worksheet.includes("ten launch tracks") &&
    worksheet.includes("Customer UX readiness") &&
    worksheet.includes("Only a `PASS` result for all three required tester slots"),
  "Beta user proof docs must include the score-safe worksheet and percentage movement rule.",
);

assert(
  adminActivityPage.includes('data-testid="admin-beta-proof-session-packet"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-session-packet-step"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-evidence-note-template"') &&
    adminActivityPage.includes("docs/beta-user-proof-session-packet.md") &&
    adminActivityPage.includes("Use this as the 10-minute operating packet"),
  "Admin activity page must expose the beta proof session packet and exact evidence note template.",
);

assert(
  adminActivityPage.includes('data-testid="admin-beta-proof-worksheet"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-worksheet-step"') &&
    adminActivityPage.includes("Score-safe worksheet") &&
    adminActivityPage.includes("PASS,") &&
    adminActivityPage.includes("REVIEW, and FAIL are recorded") &&
    adminActivityPage.includes("docs/beta-user-proof-worksheet.md") &&
    adminActivityPage.includes("Do not move the percentage unless the worksheet result is PASS") &&
    adminActivityPage.includes("ten launch tracks"),
  "Admin activity page must expose the beta proof worksheet and score-safe decision rule.",
);

assert(
  adminActivityPage.includes('data-testid="admin-beta-proof-current-score"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-score-card"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-invite-queue"') &&
    adminActivityPage.includes('data-testid="admin-beta-proof-invite-candidate"') &&
    adminActivityPage.includes("Do not count this as 78-80% anymore") &&
    adminActivityPage.includes("88-90% launch-hardening band") &&
    adminActivityPage.includes("real beta-user proof") &&
    adminActivityPage.includes("proof-first invites") &&
    adminActivityPage.includes("invite a broad batch") &&
    adminActivityPage.includes("these three slots are covered") &&
    adminActivityPage.includes("One dog owner, one cat owner, and one returning saved-pet user"),
  "Admin activity page must show the current score, why it is not 78-80%, the proof-first invite queue, and the exact beta-proof unlock.",
);

assert(
  adminActivityPage.includes('data-testid="admin-beta-proof-device-coverage"') &&
    adminActivityPage.includes("At least one mobile session") &&
    adminActivityPage.includes("device captured") &&
    adminActivityPage.includes("mobile or desktop"),
  "Admin activity page must show mobile/desktop capture as part of beta proof.",
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
    productProgress.includes("broader beta-user proof") &&
    productProgress.includes("At least one of the required beta-user journeys should be mobile"),
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
const hasMobileProof = passedUsers.some((result) => result.device === "mobile");
const reviewUsers = results.filter(
  (result) =>
    result.evidenceCount > 0 &&
    (!result.ok || result.hasPlaceholderEvidence || result.missingTerms.length > 0),
);
const missingJourneyTypes = requiredJourneyTypes
  .filter((journey) => !passedUsers.some((result) => result.journeyType === journey.type))
  .map((journey) => journey.label);
const status =
  passedUsers.length >= 3 && missingJourneyTypes.length === 0 && hasMobileProof
    ? "PASS"
    : reviewUsers.length > 0
      ? "REVIEW"
      : "PENDING";

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
    `- Missing required journey types: ${missingJourneyTypes.join(", ") || "-"}`,
    `- Mobile proof captured: ${hasMobileProof ? "yes" : "no"}`,
    "",
    "## Required Journey Types",
    "",
    "- dog owner journey",
    "- cat owner journey",
    "- returning saved-pet journey",
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
    "- device captured: mobile or desktop",
    "",
    "## Beta Users",
    "",
    "| User | Journey | Device | Status | Evidence notes | Missing terms |",
    "| --- | --- | --- | --- | --- | --- |",
    ...(results.length > 0
      ? results.map(
          (result) =>
            `| ${result.label} | ${result.journeyType} | ${result.device} | ${result.ok ? "pass" : "review"} | ${result.note}${result.hasPlaceholderEvidence ? " Placeholder/TODO evidence is not accepted." : ""} | ${result.missingTerms.join(", ") || "-"} |`,
        )
      : [
          "| none yet | unknown | unknown | pending | Add real beta-user proof to `.qa-secrets/beta-user-proof.json`. | signup/login, pet intake, food cards, selected food, grams/day, save, report, timeline or progress, feedback, no manual help, device captured |",
        ]),
    "",
    "## Next Action",
    "",
    status === "PASS"
      ? "Use this report as supporting evidence for the 88-90% Customer UX move."
      : "Collect at least three real beta-user journeys, including at least one mobile session, before moving Customer UX above 88%.",
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
      hasMobileProof,
      missingJourneyTypes,
      report: reportPath,
    },
    null,
    2,
  ),
);
