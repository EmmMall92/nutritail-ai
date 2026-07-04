import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const doc = read("docs/product-progress-score.md");
const launchDoc = read("docs/launch-readiness-score.md");
const packageJson = read("package.json");
const liveQaPage = read("app/admin/foods/v2-live-qa/page.tsx");
const customerJourneyUnlockGate = read("scripts/qa/check-customer-journey-unlock-gate.ts");
const customerLiveJourneyProof = read("scripts/qa/check-customer-live-journey-proof.mjs");
const betaUserProof = read("scripts/qa/check-beta-user-proof-contract.ts");
const betaUserProofDoc = read("docs/beta-user-proof.md");

const categoryMarkers = [
  "Final chatbot experience",
  "Saved pet continuation",
  "Pet report page",
  "Food recommendation accuracy",
  "User account polish",
  "Email/auth polish",
  "Public trust pages",
  "Analytics/feedback loop",
  "Launch QA",
  "Business layer",
];

for (const marker of categoryMarkers) {
  assert(doc.includes(marker), `Product progress rubric is missing category: ${marker}`);
}

const requiredMarkers = [
  "Customer UX readiness is currently **88%**",
  "Recommendation engine beta confidence is currently **95% beta-candidate**",
  "Overall SaaS launch progress is currently **90%**",
  "## Progress Ladder",
  "88-90% launch-hardening band",
  "Three real beta journeys without manual help",
  "NutriTail is not stuck at 78-80%",
  "## Customer UX Scorecard",
  "Customer-facing journey",
  "What is proven now",
  "What blocks the next move",
  "Logged-in production proof now covers ordered intake",
  "compact compare, choose, grams/day strip",
  "Needs broader beta-user proof",
  "`qa:customer-live-journey-proof`",
  "non-destructive checks passing",
  "Do not collapse them into one",
  "customer-facing",
  "The latest launch-wide move from **89%** to **90%**",
  "Dog live QA cases **201-600**",
  "**400/400** checked and",
  "The previously reviewed dog case **534**",
  "large-breed puppy allergy/growth path",
  "authenticated OpenAI proof",
  "The previous launch-wide move from **88%** to **89%**",
  "Cat live QA cases **201-500**",
  "**300/300** checked and",
  "renal/urinary therapeutic",
  "multi-condition cats",
  "**500/500** live cases with **0 review**",
  "pregnancy",
  "lactation",
  "urgent safety",
  "The previous launch-wide move from **87%** to **88%**",
  "Cat live QA cases **001-050**",
  "**50/50** checked and **0 review**",
  "Cat live QA cases **051-200**",
  "**150/150** checked and",
  "overweight, allergy, elimination diet, hairball, fussy",
  "GI, IBD, pancreatitis, diabetes",
  "low activity alone",
  "sterilised/weight-prone reasoning",
  "The previous launch-wide move from **86%** to **87%**",
  "fresh live",
  "recommendation QA evidence",
  "Dog live QA cases **93-120**, **121-150**, **151-175**, and **176-200**",
  "**108/108** checked and **0 review**",
  "διάρροια με αίμα και είναι κουτάβι",
  "preserves puppy",
  "blood red flag",
  "NUTRITAIL_QA_CASE_IDS=86 qa:dog-chatbot-live-cases",
  "The previous launch-wide move from **85%** to **86%**",
  "future Personal and Pro paid-plan direction",
  "Auth recovery flows now have customer-facing copy",
  "paid checkout, billing",
  "final legal review",
  "subscription or payment direction",
  "legal/trust",
  "real public SaaS",
  "The latest customer-facing work moves Customer UX readiness from **87%** to",
  "46a04066-d1a7-40ff-857c-0e37f55c0234",
  "7/7",
  "report/account clarity",
  "account, pet profile, report",
  "why it fits",
  "next check-in",
  "The previous customer-facing work moved Customer UX readiness from **86%** to",
  "6b524f8b-fb05-45c6-a91d-f63b68768d33",
  "6/6",
  "no-result follow-up",
  "flavour/brand-change",
  "fresh new-food recommendation route",
  "Report/account proof",
  "The previous customer-facing work moved Customer UX readiness from **85%** to",
  "`qa:clean-customer-wording-proof` protects generated recommendation output",
  "clean composed",
  "clean printable report wording",
  "d14cb9ca-a114-4bb4-937a-096260c5f4d4",
  "broader returning saved-pet continuation proof",
  "The previous customer-facing work moved Customer UX readiness from **84%** to",
  "PASS_FULL",
  "controlled authenticated live",
  "95 grams/day",
  "returned to the same pet in progress mode",
  "The previous customer-facing work moved Customer UX readiness from **83%** to",
  "duplicate guide panels",
  "one compact decision strip",
  "compare fit and taste, choose",
  "selected-food grams/day flow",
  "The previous customer-facing work moved Customer UX readiness from **82%** to",
  "scopes OpenAI/fallback extracted facts to the active",
  "A logged-in production browser smoke completed the non-save journey",
  "selected",
  "grams/day",
  "first-week checklist",
  "The latest engine-confidence move from **94-95%** to **95% beta-candidate**",
  "returning-customer nutrition loop",
  "2-4 week progress-check reminder",
  "new",
  "real grams/day",
  "treats, appetite, stool, energy",
  "Dog live QA cases **101-200**",
  "**100/100** checked and",
  "high-activity and working dogs",
  "GI and allergy/intolerance",
  "pregnancy/lactation",
  "not raise the customer UX readiness score by itself",
  "no longer sitting at the 78-80% foundation level",
  "Dog live QA cases **101-110**",
  "**10/10** checked and **0 review**",
  "`NUTRITAIL_QA_OPENAI=1`",
  "OpenAI extracts the pet facts",
  "Food V2 retrieval and ranking deterministic",
  "authenticated live chatbot extract route still needs a QA account cookie run",
  "Fresh current QA evidence on **July 2, 2026**",
  "Dog live QA cases **101-200** pass again with **100/100** checked",
  "with OpenAI extraction enabled",
  "Cat live QA cases **001-100** pass with **100/100** checked and **0 review**",
  "hairball, picky-eater, rescue, climate",
  "hybrid OpenAI/NutriTail",
  "does not raise the score above 95%",
  "Fresh Food V2 format coverage",
  "`qa:food-v2-format-coverage` confirms that dry dog and dry cat scenarios",
  "Cat wet has visible options",
  "dog wet still has no safe",
  "data-coverage blocker",
  "The previous move from **93-94%** to **94-95%**",
  "Auth success states",
  "printable pet report now surfaces the latest progress check",
  "beta waitlist visibility",
  "subscription/payment",
  "The latest move from **92-93%** to **93-94%**",
  "authenticated",
  "OpenAI/chatbot intake-context fix",
  "saved/selected pet species context",
  "effective **199/200**",
  "same shared OpenAI prompt contract",
  "fallback merge",
  "Greek/English allergy, sensitivity, mixed",
  "The previous move from **91-92%** to **92-93%**",
  "metadata-only",
  "working Husky",
  "Food V2 ranking audit passes 38/38",
  "The previous move from **90-91%** to **91-92%**",
  "Weight goal is now preserved",
  "active weight-gain dog guard",
  "Food V2 launch-edge accuracy",
  "The previous move from **89-90%** to **90-91%**",
  "drop-off priorities for analyses without",
  "choice clarity, save confidence, food matching, and",
  "answer usefulness",
  "Do not raise this score because a pull request merged",
  "Automated live readiness",
  "customer-visible risk is reduced",
  "real mistake and the fix is locked by a test",
  "wet/canned dog or cat recommendations",
  "3 premium + 3 value choices",
  "progress check, no-progress advice, new food, flavour change, brand change, and timeline review",
  "OpenAI intake extraction",
  "Customer UX Unlock Gates",
  "Full recommendation journey proof",
  "`qa:customer-live-journey-proof` reached PASS_FULL",
  "same saved pet",
  "completed to 85% Customer UX readiness",
  "Clean customer wording proof",
  "completed to 86% Customer UX readiness",
  "`qa:clean-customer-wording-proof` protects generated customer recommendation output",
  "proof-status",
  "clean composed chatbot wording plus clean printable report wording",
  "Returning pet proof",
  "completed to 87% Customer UX readiness",
  "progress check, no-result follow-up, flavour/brand change, new food recommendation route, and timeline review",
  "Report/account proof",
  "completed to 88% Customer UX readiness",
  "Real beta-user proof",
  "88-90% Customer UX readiness",
  "`qa:beta-user-proof-contract`",
  ".qa-secrets/beta-user-proof.json",
  "without manual help",
  "Customer UX readiness",
  "Recommendation engine beta confidence",
  "95% beta-candidate",
  "Overall SaaS Blockers",
  "Food V2 dry-food recommendations are usable",
  "authenticated extraction",
  "Production monitoring and post-deploy freshness",
  "first real beta-user feedback cycle",
  "Beta access, plan limits, subscription/payment direction",
];

for (const marker of requiredMarkers) {
  assert(doc.includes(marker), `Product progress rubric is missing marker: ${marker}`);
}

assert(
  !doc.includes("overall SaaS launch progress is about 87%") &&
    !doc.includes("whole project remains around 87%"),
  "Product progress rubric must not keep stale 87% overall SaaS launch wording after the 90% update."
);

const weights = [...doc.matchAll(/\| [^|\n]+ \| (\d+) \|/g)]
  .map((match) => Number(match[1]))
  .filter((value) => Number.isFinite(value));

const totalWeight = weights.reduce((sum, value) => sum + value, 0);

assert(weights.length >= 10, "Product progress rubric must include at least 10 weighted categories.");
assert(totalWeight === 100, `Product progress category weights must total 100, got ${totalWeight}.`);

assert(
  launchDoc.includes("docs/product-progress-score.md") &&
    launchDoc.includes("Customer Product Progress Score") &&
    launchDoc.includes("Recommendation engine beta confidence") &&
    launchDoc.includes("customer UX readiness"),
  "Launch readiness score doc must point to the product progress score rubric."
);

assert(
  packageJson.includes('"qa:product-progress-score-contract"'),
  "package.json must expose qa:product-progress-score-contract."
);

assert(
  packageJson.includes('"qa:customer-journey-unlock-gate"'),
  "package.json must expose qa:customer-journey-unlock-gate so the first customer UX unlock gate has a protected evidence check."
);

assert(
  packageJson.includes('"qa:customer-live-journey-proof"'),
  "package.json must expose qa:customer-live-journey-proof for the non-destructive logged-in live journey proof."
);

assert(
  packageJson.includes('"qa:beta-user-proof-contract"'),
  "package.json must expose qa:beta-user-proof-contract for the real beta-user proof gate."
);

assert(
  packageJson.includes("qa:customer-live-journey-proof && npm run qa:beta-user-proof-contract"),
  "CI readiness must run beta-user proof after customer live journey proof."
);

assert(
  packageJson.includes('"qa:chatbot-calorie-copy"') &&
    packageJson.includes('"qa:clean-customer-wording-proof"') &&
    packageJson.includes('"qa:missing-format-recommendation-message"') &&
    packageJson.includes("qa:customer-ux-copy && npm run qa:missing-format-recommendation-message && npm run qa:clean-customer-wording-proof && npm run qa:chatbot-calorie-copy"),
  "CI readiness must protect missing-format fallback, clean customer wording, and chatbot calorie wording after the customer UX copy contract."
);

assert(
  customerJourneyUnlockGate.includes("reports/customer_journey_unlock_gate_qa.md") &&
    customerJourneyUnlockGate.includes("This report is customer-product evidence") &&
    customerJourneyUnlockGate.includes("Manual Live Follow-Up") &&
    customerJourneyUnlockGate.includes("Wrote ${reportPath}."),
  "Customer journey unlock gate must write an auditable report with manual live follow-up steps."
);

assert(
  customerLiveJourneyProof.includes("reports/customer_live_journey_proof_qa.md") &&
    customerLiveJourneyProof.includes("This is a non-destructive live proof") &&
    customerLiveJourneyProof.includes("It does not save pets") &&
    customerLiveJourneyProof.includes("/api/account/chatbot/extract-intake") &&
    customerLiveJourneyProof.includes("/api/account/chatbot/compose-recommendation") &&
    customerLiveJourneyProof.includes("/api/account/foods/v2-recommendations") &&
    customerLiveJourneyProof.includes("Clean chatbot recommendation wording") &&
    customerLiveJourneyProof.includes("report_clean_wording") &&
    customerLiveJourneyProof.includes("clean report wording") &&
    customerLiveJourneyProof.includes("NUTRITAIL_QA_AUTH_COOKIE_FILE") &&
    customerLiveJourneyProof.includes("fallbackCookieFiles") &&
    customerLiveJourneyProof.includes("Customer Journey Proof Checklist") &&
    customerLiveJourneyProof.includes("Customer journeys tracked") &&
    customerLiveJourneyProof.includes("Manual journeys still required") &&
    customerLiveJourneyProof.includes("New pet recommendation") &&
    customerLiveJourneyProof.includes("Return for progress") &&
    customerLiveJourneyProof.includes("Returning saved-pet continuation") &&
    customerLiveJourneyProof.includes("returning_continuation") &&
    customerLiveJourneyProof.includes("no-result") &&
    customerLiveJourneyProof.includes("new food") &&
    customerLiveJourneyProof.includes("SKIP_AUTH") &&
    customerLiveJourneyProof.includes("PASS_NON_DESTRUCTIVE") &&
    customerLiveJourneyProof.includes("NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF") &&
    customerLiveJourneyProof.includes("NUTRITAIL_QA_KEEP_LIVE_WRITE_PROOF") &&
    customerLiveJourneyProof.includes("cleanup_live_write_pet") &&
    customerLiveJourneyProof.includes("soft-delete enabled by default") &&
    customerLiveJourneyProof.includes("DELETE /api/account/pets/:id") &&
    customerLiveJourneyProof.includes("/api/account/chatbot/save"),
  "Customer live journey proof must default to non-destructive auth/card checks and require an explicit live-write flag for save/report/timeline/progress proof."
);

assert(
  betaUserProof.includes("reports/beta_user_proof_qa.md") &&
    betaUserProof.includes(".qa-secrets/beta-user-proof.json") &&
    betaUserProof.includes("PENDING") &&
    betaUserProof.includes("PASS") &&
    betaUserProof.includes("REVIEW") &&
    betaUserProof.includes("signup/login") &&
    betaUserProof.includes("pet intake") &&
    betaUserProof.includes("food cards") &&
    betaUserProof.includes("selected food") &&
    betaUserProof.includes("grams/day") &&
    betaUserProof.includes("no manual help") &&
    betaUserProof.includes("passedUsers.length >= 3"),
  "Beta user proof must define a non-blocking PENDING/PASS/REVIEW gate for at least three real beta-user journeys."
);

assert(
  betaUserProofDoc.includes("Only `PASS` should justify moving Customer UX from 88% toward 90%") &&
    betaUserProofDoc.includes("one dog owner") &&
    betaUserProofDoc.includes("one cat owner") &&
    betaUserProofDoc.includes("one returning saved-pet user"),
  "Beta user proof doc must explain the minimum real-user evidence for the 88-90% move."
);

assert(
  packageJson.includes('"qa:food-v2-format-coverage"'),
  "package.json must expose qa:food-v2-format-coverage so wet/dry data coverage can be checked."
);

assert(
  packageJson.includes(
    "qa:customer-journey-readiness-contract && npm run qa:customer-journey-unlock-gate && npm run qa:customer-live-journey-proof && npm run qa:beta-user-proof-contract && npm run qa:customer-launch-10-track-audit && npm run qa:launch-readiness-score-contract"
  ),
  "CI readiness must run customer journey, live journey, beta-user proof, and 10-track audit gates before launch and product progress score contracts."
);

assert(
  packageJson.includes('"qa:customer-launch-10-track-audit"'),
  "package.json must expose qa:customer-launch-10-track-audit for the 10-track launch audit."
);

assert(
  liveQaPage.includes("function readCustomerLaunchTrackAuditSummary") &&
    liveQaPage.includes("docs/customer-launch-10-track-audit.md") &&
    liveQaPage.includes('data-testid="customer-launch-10-track-audit"') &&
    liveQaPage.includes("10-track launch audit") &&
    liveQaPage.includes("Why the percentage should not move until the next proof is real") &&
    liveQaPage.includes("Current proof") &&
    liveQaPage.includes("Next proof needed"),
  "Admin live QA page must expose the 10-track launch audit that explains the real score blockers."
);

assert(
  packageJson.includes(
    "qa:launch-readiness-score-contract && npm run qa:product-progress-score-contract && npm run qa:pr-quality-policy"
  ),
  "CI readiness must run product progress score contract after launch readiness score contract."
);

assert(
  liveQaPage.includes("function readCustomerProductProgressSummary") &&
    liveQaPage.includes("docs/product-progress-score.md"),
  "Admin live QA page must read the customer product progress rubric."
);

assert(
    liveQaPage.includes('data-testid="progress-truth-panel"') &&
    liveQaPage.includes('data-testid="customer-progress-ladder"') &&
    liveQaPage.includes("Progress ladder") &&
    liveQaPage.includes("Current band: 88-90% launch hardening") &&
    liveQaPage.includes("Old foundation") &&
    liveQaPage.includes("Do not treat this as the current state") &&
    liveQaPage.includes("Progress truth panel") &&
    liveQaPage.includes("past the old 78-80% foundation stage") &&
    liveQaPage.includes("The next percentage jump needs real customer evidence") &&
    liveQaPage.includes("What proves the next move") &&
    liveQaPage.includes("What does not prove it") &&
    liveQaPage.includes("Command to unlock the gate") &&
    liveQaPage.includes("returning saved-pet user") &&
    liveQaPage.includes("without") &&
    liveQaPage.includes("manual help") &&
    liveQaPage.includes("npm.cmd run qa:beta-user-proof-contract"),
  "Admin live QA page must show a prominent progress truth panel with the real next proof gate."
);

assert(
  liveQaPage.includes('data-testid="customer-progress-proof-gate"') &&
    liveQaPage.includes("The project is no longer in the 78-80% foundation stage") &&
    liveQaPage.includes("real beta users must") &&
    liveQaPage.includes("One dog owner, one cat owner, and one returning saved-pet") &&
    liveQaPage.includes("Small merges alone"),
  "Admin live QA page must explain why the progress score feels stuck and what real customer proof unlocks the next move."
);

assert(
  liveQaPage.includes("function readFoodV2FormatCoverageSummary") &&
    liveQaPage.includes("reports/food_v2_format_coverage_qa.md") &&
    liveQaPage.includes('data-testid="food-v2-format-coverage-summary"') &&
    liveQaPage.includes("Food V2 format coverage") &&
    liveQaPage.includes("Wet/canned data gap is still visible") &&
    liveQaPage.includes("npm.cmd run qa:food-v2-format-coverage") &&
    liveQaPage.includes("formatCoverage.wetCannedDataGaps") &&
    liveQaPage.includes("formatCoverage.safeHolds") &&
    liveQaPage.includes("scenario.coverageStatus"),
  "Admin live QA page must expose Food V2 dry/wet format coverage, safe holds, and wet/canned data gaps."
);

assert(
  liveQaPage.includes('data-testid="customer-product-progress-summary"') &&
    liveQaPage.includes('data-testid="customer-product-progress-readout"') &&
    liveQaPage.includes('data-testid="customer-ux-scorecard"') &&
    liveQaPage.includes("Customer product progress") &&
    liveQaPage.includes("Customer UX scorecard") &&
    liveQaPage.includes("productProgress.scorecard") &&
    liveQaPage.includes("Proven now") &&
    liveQaPage.includes("Blocks next move") &&
    liveQaPage.includes("Customer UX readiness") &&
    liveQaPage.includes("Recommendation engine") &&
    liveQaPage.includes("Overall SaaS launch") &&
    liveQaPage.includes("scoreReadout") &&
    liveQaPage.includes("Customer UX readiness:") &&
    liveQaPage.includes("Recommendation engine beta confidence:") &&
    liveQaPage.includes("Overall SaaS launch progress:") &&
    liveQaPage.includes("productProgress.customerUxEstimate") &&
    liveQaPage.includes("productProgress.recommendationEngineEstimate") &&
    liveQaPage.includes("productProgress.overallSaasEstimate") &&
    liveQaPage.includes("productProgress.overallLaunchBlockers") &&
    liveQaPage.includes("separate from automated"),
  "Admin live QA page must expose the customer product progress summary."
);

assert(
  liveQaPage.includes("Why it may not move every PR") &&
    liveQaPage.includes('data-testid="customer-product-next-unlock"') &&
    liveQaPage.includes("Next customer score unlock") &&
    liveQaPage.includes("Evidence needed next") &&
    liveQaPage.includes("real beta users can finish the whole nutrition") &&
    liveQaPage.includes('data-testid="customer-product-score-rule"') &&
    liveQaPage.includes("Score movement rule") &&
    liveQaPage.includes("Automated readiness can stay high while Customer UX readiness stays") &&
    liveQaPage.includes("Next moves toward") &&
    liveQaPage.includes('data-testid="customer-ux-unlock-gates"') &&
    liveQaPage.includes("customerUxUnlockGates") &&
    liveQaPage.includes("What actually moves Customer UX readiness above") &&
    liveQaPage.includes("Real beta-user proof") &&
    liveQaPage.includes('data-testid="beta-user-proof-summary"') &&
    liveQaPage.includes('data-testid="beta-user-proof-required-journeys"') &&
    liveQaPage.includes('data-testid="beta-user-proof-missing-journeys"') &&
    liveQaPage.includes("Missing journey types:") &&
    liveQaPage.includes("Journey: {user.journey}") &&
    liveQaPage.includes("qa:beta-user-proof-contract") &&
    liveQaPage.includes("Beta-user proof is still pending") &&
    liveQaPage.includes("95%+") &&
    liveQaPage.includes('data-testid="overall-saas-launch-blockers"') &&
    liveQaPage.includes("What still keeps overall SaaS launch lower"),
  "Admin live QA page must explain why the score feels stuck, what moves it next, and which customer UX gates unlock the next band."
);

assert(
  liveQaPage.includes("function readCustomerJourneyUnlockProofSummary") &&
    liveQaPage.includes("reports/customer_journey_unlock_gate_qa.md") &&
    liveQaPage.includes('data-testid="customer-journey-unlock-proof-summary"') &&
    liveQaPage.includes("Customer journey unlock proof") &&
    liveQaPage.includes("Five customer journeys are protected") &&
    liveQaPage.includes("customerJourneyProof.journeysChecked") &&
    liveQaPage.includes("customerJourneyProof.evidenceMarkersChecked") &&
    liveQaPage.includes("customerJourneyProof.unlockGatesCovered") &&
    liveQaPage.includes("customerJourneyProof.nextManualProof") &&
    liveQaPage.includes('data-testid="customer-journey-manual-follow-up"') &&
    liveQaPage.includes("npm.cmd run qa:customer-journey-unlock-gate"),
  "Admin live QA page must expose the customer journey unlock proof report and manual follow-up."
);

assert(
  liveQaPage.includes("function readCustomerLiveJourneyProofSummary") &&
    liveQaPage.includes("reports/customer_live_journey_proof_qa.md") &&
    liveQaPage.includes('data-testid="customer-live-journey-proof-summary"') &&
    liveQaPage.includes("Customer live journey proof") &&
    liveQaPage.includes("Logged-in live journey proof is passing") &&
    liveQaPage.includes("Logged-in live journey proof is still pending") &&
    liveQaPage.includes("customerLiveJourneyProof.unlockImpact") &&
    liveQaPage.includes("customerLiveJourneyProof.authCookieSource") &&
    liveQaPage.includes("customerLiveJourneyProof.customerJourneysTracked") &&
    liveQaPage.includes("customerLiveJourneyProof.manualJourneysStillRequired") &&
    liveQaPage.includes("customerLiveJourneyProof.journeyChecklist") &&
    liveQaPage.includes('data-testid="customer-live-journey-checklist"') &&
    liveQaPage.includes("Customer journey checklist") &&
    liveQaPage.includes("Customer live journey proof checklist") &&
    liveQaPage.includes("npm.cmd run qa:customer-live-journey-proof"),
  "Admin live QA page must expose the non-destructive customer live journey proof status and next steps."
);

assert(
  liveQaPage.includes('data-testid="openai-full-proof-runbook"') &&
    liveQaPage.includes("Full OpenAI proof action") &&
    liveQaPage.includes("authenticated QA") &&
    liveQaPage.includes("npm.cmd run qa:openai-full-proof"),
  "Admin live QA page must show the concrete OpenAI proof action that can move readiness confidence."
);

console.log("Product progress score contract passed.");
