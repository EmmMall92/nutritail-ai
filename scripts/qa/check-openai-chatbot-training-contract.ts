import { readFileSync } from "node:fs";
import {
  buildAuthorityContractPrompt,
  NUTRITAIL_AI_AUTHORITY_CONTRACT,
  NUTRITAIL_AI_FORBIDDEN_ACTIONS,
} from "@/lib/ai/authorityContract";
import {
  buildAnswerWriterUserPrompt,
  buildNutriTailSystemPrompt,
  NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS,
  NUTRITAIL_FACT_EXTRACTION_INSTRUCTIONS,
  NUTRITAIL_TONE_INSTRUCTIONS,
} from "@/lib/ai/promptInstructions";
import {
  buildIntakeExtractionSystemPrompt,
  buildIntakeExtractionUserPrompt,
  NUTRITAIL_INTAKE_ALLOWED_ENUMS,
  NUTRITAIL_INTAKE_JSON_KEYS,
} from "@/lib/ai/intakePromptContract";
import {
  buildNutritionKnowledgeContext,
  inferKnowledgeIntents,
} from "@/lib/ai/knowledgeRetrieval";
import {
  NUTRITAIL_CHATBOT_TRAINING_ROADMAP,
  NUTRITAIL_FINE_TUNING_NOT_NOW_REASONS,
} from "@/lib/ai/trainingRoadmap";

const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function includesAll(text: string, snippets: string[], label: string) {
  for (const snippet of snippets) {
    expect(text.includes(snippet), `${label} is missing: ${snippet}`);
  }
}

function assertNoMojibake(sourcePath: string) {
  const source = readFileSync(sourcePath, "utf8");
  const mojibakePattern = new RegExp(
    "(?:[?]{3,}|\\uFFFD|\\u00C2|\\u00CE|\\u00CF|[\\u0080-\\u009f])",
    "u"
  );
  expect(
    !mojibakePattern.test(source),
    `${sourcePath} contains damaged Greek or mojibake text`
  );
}

const authorityPrompt = buildAuthorityContractPrompt();
includesAll(
  authorityPrompt,
  [
    "Database truth",
    "Rules truth",
    "OpenAI role",
    "Do not choose foods outside",
    "Do not invent brands",
    "Do not declare a generic brand winner",
    "Do not pretend a current food was matched",
  ],
  "authority prompt"
);
expect(
  NUTRITAIL_AI_AUTHORITY_CONTRACT.openAiRole.includes("must not rank foods"),
  "authority contract must forbid OpenAI ranking"
);
expect(
  NUTRITAIL_AI_FORBIDDEN_ACTIONS.some((rule) => rule.includes("source tier")),
  "forbidden actions must hide backend source/review wording from customers"
);

const factPrompt = buildNutriTailSystemPrompt("fact_extraction");
includesAll(
  factPrompt,
  [
    "Return strict JSON only",
    "Do not recommend foods",
    "Extract only structured pet nutrition intake facts",
  ],
  "fact extraction prompt"
);
expect(
  NUTRITAIL_FACT_EXTRACTION_INSTRUCTIONS.some((rule) =>
    rule.includes("Keep liked proteins and avoided/allergy proteins separate")
  ),
  "fact extraction must keep liked and avoided proteins separate"
);
const intakeSystemPrompt = buildIntakeExtractionSystemPrompt();
includesAll(
  intakeSystemPrompt,
  [
    "Return strict JSON only",
    NUTRITAIL_INTAKE_ALLOWED_ENUMS,
    "Do not recommend foods",
  ],
  "shared intake extraction system prompt"
);
expect(
  NUTRITAIL_INTAKE_JSON_KEYS.includes("preferredProteins") &&
    NUTRITAIL_INTAKE_JSON_KEYS.includes("excludedIngredients") &&
    NUTRITAIL_INTAKE_JSON_KEYS.includes("redFlags"),
  "shared intake JSON keys must cover preferences, exclusions, and red flags"
);
const intakeUserPrompt = buildIntakeExtractionUserPrompt("Dog 10kg likes salmon.");
includesAll(
  intakeUserPrompt,
  ["Message:", "Dog 10kg likes salmon.", "Return JSON with keys:"],
  "shared intake extraction user prompt"
);

const answerPrompt = buildNutriTailSystemPrompt("answer_writer");
includesAll(
  answerPrompt,
  [
    "Use only ranked foods",
    "Do not add new brands",
    "For brand comparisons, compare only retrieved products",
    "If the current food or product match is uncertain",
    "Do not include backend review/source-quality wording",
    "Do not mention OpenAI, model names, prompts, QA checks, proof status, or internal tooling to customers",
    "When food cards follow, use at most 4 short sentences",
    "Do not expose scores, confidence labels, source quality, review status, or missing-field details to customers",
  ],
  "answer writer prompt"
);
expect(
  NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS.some((rule) =>
    rule.includes("Preserve exact customer food names")
  ),
  "answer writer must preserve food names from NutriTail payload"
);
const cardWriterPrompt = buildAnswerWriterUserPrompt({
  locale: "el",
  groundedJson: {
    cards_follow: true,
    allowed_food_names: ["Royal Canin Mini Adult", "Josera Sensi Plus Adult"],
    premium: [{ customer_name: "Royal Canin Mini Adult" }],
    value: [{ customer_name: "Josera Sensi Plus Adult" }],
  },
});
includesAll(
  cardWriterPrompt,
  [
    "Allowed food names:",
    "- Royal Canin Mini Adult",
    "- Josera Sensi Plus Adult",
    "Mention only foods from the Allowed food names list.",
    "Do not add other foods, brands, variants, or generic brand winners.",
    "Food cards follow this message:",
    "at most 4 short sentences",
    "Mention only the single best starting food by name",
    "Do not repeat card lists, scores, confidence labels, source quality, review status, or missing fields",
    "choose a food card to estimate daily portions",
  ],
  "answer writer card-flow user prompt"
);
expect(
  NUTRITAIL_TONE_INSTRUCTIONS.some((rule) => rule.includes("Greek")),
  "tone instructions must include Greek language behavior"
);

const knowledge = buildNutritionKnowledgeContext(["renal", "urinary", "growth"]);
expect(
  knowledge.source_priority[0]?.id === "CANINE_FELINE_NUTRITION_BOOK",
  "knowledge source priority must start from the uploaded nutrition book"
);
expect(
  knowledge.guardrails.some((rule) =>
    rule.includes("does not authorize OpenAI to rank foods")
  ),
  "knowledge guardrails must keep OpenAI out of ranking"
);
expect(
  knowledge.guardrails.some((rule) =>
    rule.includes("product comparisons must use retrieved Food V2 rows")
  ),
  "knowledge guardrails must keep brand comparisons grounded in retrieved products"
);
expect(
  knowledge.guardrails.some((rule) =>
    rule.includes("ask for a label/photo instead of filling gaps from model memory")
  ),
  "knowledge guardrails must block model-memory formula gap filling"
);
expect(
  knowledge.principles.some((rule) => rule.includes("Renal cases")),
  "knowledge context must include renal decision principles"
);
expect(
  knowledge.principles.some((rule) => rule.includes("Urinary recommendations")),
  "knowledge context must include urinary decision principles"
);
expect(
  knowledge.principles.some((rule) => rule.includes("Large-breed puppies")),
  "knowledge context must include growth decision principles"
);

const inferred = inferKnowledgeIntents({
  goal: "renal",
  petSummary: {
    healthIssues: ["ουρολογικό με στρουβίτη και φαγούρα"],
    neutered: true,
    activityLevel: "high",
    weightGoal: "loss",
  },
});
for (const intent of [
  "renal",
  "urinary",
  "allergy",
  "sterilised",
  "active_working",
  "weight_control",
]) {
  expect(
    inferred.includes(intent as (typeof inferred)[number]),
    `inferred intents missing ${intent}`
  );
}

const fineTuningPhase = NUTRITAIL_CHATBOT_TRAINING_ROADMAP.find(
  (phase) => phase.phase === "fine_tuning"
);
expect(fineTuningPhase?.status === "later", "fine-tuning must stay marked as later");
expect(
  NUTRITAIL_FINE_TUNING_NOT_NOW_REASONS.length >= 3,
  "fine-tuning policy should explain why it is not the current training path"
);

assertNoMojibake("scripts/qa/check-openai-intake-smoke.ts");
assertNoMojibake("scripts/qa/check-openai-chatbot-training-contract.ts");
assertNoMojibake("lib/ai/intakePromptContract.ts");

const openAiSmokeSource = readFileSync("scripts/qa/check-openai-intake-smoke.ts", "utf8");
includesAll(
  openAiSmokeSource,
  [
    "buildIntakeExtractionSystemPrompt",
    "buildIntakeExtractionUserPrompt",
    "extractJsonObjectFromOpenAiText",
    "\\u0388\\u03c7\\u03c9 \\u03c3\\u03ba\\u03cd\\u03bb\\u03bf",
    "\\u039f \\u03b3\\u03ac\\u03c4\\u03bf\\u03c2 \\u03bc\\u03bf\\u03c5",
    "validateAiIntakeExtraction",
    "NUTRITAIL_QA_OPENAI_API_KEY_FILE",
    "loadOpenAiApiKey",
    "The key value was not written to this report.",
  ],
  "OpenAI intake smoke source"
);

const openAiFullProofSource = readFileSync("scripts/qa/check-openai-full-proof.mjs", "utf8");
includesAll(
  openAiFullProofSource,
  [
    "OpenAI Full Proof QA",
    "qa:openai-intake-smoke",
    "qa:account-chatbot-extract-live-route",
    "Full OpenAI proof",
    "NUTRITAIL_QA_OPENAI_API_KEY_FILE",
    "NUTRITAIL_QA_AUTH_COOKIE_FILE",
    "Do not commit, print, paste, or screenshot the key or cookie.",
    "Food ranking, exclusions, medical safety and nutrient truth stay in NutriTail deterministic code.",
  ],
  "OpenAI full proof source"
);

const adminAiStatusRouteSource = readFileSync("app/api/admin/ai-status/route.ts", "utf8");
includesAll(
  adminAiStatusRouteSource,
  [
    "requireAdminApiAccess",
    "pingOpenAiRuntime",
    'searchParams.get("ping") === "1"',
    "getOpenAiClient",
    "admin runtime connectivity check",
    "openai_not_allowed_for",
  ],
  "admin AI status route"
);

const adminValidationPageSource = readFileSync("app/admin/validation/page.tsx", "utf8");
includesAll(
  adminValidationPageSource,
  [
    "/api/admin/ai-status?ping=1",
    "OpenAI runtime ping",
    "OpenAI production checklist",
    "Server-side OpenAI check passed",
    "without exposing the",
    "Set a non-empty",
    "qa:openai-intake-smoke",
  ],
  "admin validation OpenAI runtime status"
);

const postDeployReadinessSource = readFileSync(
  "scripts/qa/run-post-deploy-readiness.mjs",
  "utf8"
);
includesAll(
  postDeployReadinessSource,
  [
    "NUTRITAIL_QA_REFRESH_CHATBOT",
    "--refresh-chatbot",
    "qa:chatbot-golden-suite:fast",
    "qa:chatbot-live-dashboard",
    "qa:openai-full-proof:report",
    "Chatbot QA refreshed in this run",
  ],
  "post-deploy chatbot refresh gate"
);
expect(
  postDeployReadinessSource.indexOf("qa:chatbot-golden-suite:fast") <
    postDeployReadinessSource.indexOf("qa:chatbot-live-dashboard"),
  "post-deploy refresh must run the fast golden suite before the live chatbot dashboard"
);

const responseComposerSource = readFileSync("lib/ai/responseComposer.ts", "utf8");
includesAll(
  responseComposerSource,
  [
    "repairLegacyGreekMojibakeText",
    "polishCustomerFacingLanguage",
    "sanitizeGroundingText",
    "allowed_food_names",
    "product_grounding_policy",
    "Mention recommended foods only when their exact customer name appears in allowed_food_names.",
    "Do not add brand-level winners or unlisted alternatives.",
    "ask for the exact bag name or a label photo",
    "deterministic_text: sanitizeGroundingText(input.deterministicText)",
    "mentionsAtLeastOneAllowedFood",
    "mentionsUnallowedGuardedBrand",
    "composer_mentioned_unlisted_food_brand",
  ],
  "response composer fallback language repair"
);
expect(
  responseComposerSource.includes(".map(sanitizeGroundingText)") &&
    responseComposerSource.includes(".filter(Boolean) ?? []"),
  "response composer must sanitize recommendation notes before sending them to OpenAI"
);
for (const forbiddenGroundingTerm of [
  "needs[_\\s-]?review",
  "source\\s*tier",
  "data\\s*quality",
  "missing\\s*nutrition\\s*fields?",
  "confidence\\s*internals",
  "(?:score|total_score|match_score)\\s*[:=]?\\s*\\d{1,3}",
  "(?:high|medium|low)\\s+confidence",
  "confidence\\s*[:=]\\s*(?:high|medium|low)",
  "retailer\\s*source",
  "source:\\s*[^\\n\\r]+",
]) {
  expect(
    responseComposerSource.includes(forbiddenGroundingTerm),
    `response composer grounding sanitizer must strip ${forbiddenGroundingTerm}`
  );
}
expect(
  !/\?{3,}/.test(responseComposerSource),
  "response composer must not contain replacement-question-mark customer text"
);
expect(
  responseComposerSource.includes("\\u0388\\u03bb\\u03b5\\u03b3\\u03c7\\u03bf\\u03c2 \\u03b2\\u03ac\\u03c1\\u03bf\\u03c5\\u03c2"),
  "response composer must keep Greek fallback replacements ASCII-safe"
);

const foodBrandGuardSource = readFileSync("lib/ai/foodBrandGuard.ts", "utf8");
includesAll(
  foodBrandGuardSource,
  [
    "NUTRITAIL_GUARDED_FOOD_BRANDS",
    "normalizeComposerGuardText",
    "mentionsUnallowedGuardedBrand",
    "mentionsAtLeastOneAllowedFood",
    "customerFoodDisplayName(food)",
    "customerFoodName(food)",
    "royal canin",
    "acana",
    "hill's",
    "n&d",
  ],
  "OpenAI food brand guard source"
);

if (failures.length > 0) {
  console.error("OpenAI chatbot training contract QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("OpenAI chatbot training contract QA passed.");
