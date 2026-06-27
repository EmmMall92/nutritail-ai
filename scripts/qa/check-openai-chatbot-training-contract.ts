import {
  buildAuthorityContractPrompt,
  NUTRITAIL_AI_AUTHORITY_CONTRACT,
  NUTRITAIL_AI_FORBIDDEN_ACTIONS,
} from "@/lib/ai/authorityContract";
import {
  buildNutriTailSystemPrompt,
  NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS,
  NUTRITAIL_FACT_EXTRACTION_INSTRUCTIONS,
  NUTRITAIL_TONE_INSTRUCTIONS,
} from "@/lib/ai/promptInstructions";
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

const authorityPrompt = buildAuthorityContractPrompt();
includesAll(
  authorityPrompt,
  [
    "Database truth",
    "Rules truth",
    "OpenAI role",
    "Do not choose foods outside",
    "Do not invent brands",
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

const answerPrompt = buildNutriTailSystemPrompt("answer_writer");
includesAll(
  answerPrompt,
  [
    "Use only ranked foods",
    "Do not add new brands",
    "Do not include backend review/source-quality wording",
  ],
  "answer writer prompt"
);
expect(
  NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS.some((rule) =>
    rule.includes("Preserve exact customer food names")
  ),
  "answer writer must preserve food names from NutriTail payload"
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
  knowledge.guardrails.some((rule) => rule.includes("does not authorize OpenAI to rank foods")),
  "knowledge guardrails must keep OpenAI out of ranking"
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
for (const intent of ["renal", "urinary", "allergy", "sterilised", "active_working", "weight_control"]) {
  expect(inferred.includes(intent as (typeof inferred)[number]), `inferred intents missing ${intent}`);
}

const fineTuningPhase = NUTRITAIL_CHATBOT_TRAINING_ROADMAP.find(
  (phase) => phase.phase === "fine_tuning"
);
expect(fineTuningPhase?.status === "later", "fine-tuning must stay marked as later");
expect(
  NUTRITAIL_FINE_TUNING_NOT_NOW_REASONS.length >= 3,
  "fine-tuning policy should explain why it is not the current training path"
);

if (failures.length > 0) {
  console.error("OpenAI chatbot training contract QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("OpenAI chatbot training contract QA passed.");
