import { readFileSync } from "node:fs";

type Check = {
  name: string;
  pass: boolean;
  details: string;
};

const constitution = readFileSync("docs/project-constitution.md", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const authorityContract = readFileSync("lib/ai/authorityContract.ts", "utf8");
const promptInstructions = readFileSync("lib/ai/promptInstructions.ts", "utf8");
const dialogueReadme = readFileSync("data/dialogue-corpus/README.md", "utf8");

function hasAll(source: string, required: string[]) {
  const lower = source.toLowerCase();
  return required.every((item) => lower.includes(item.toLowerCase()));
}

const checks: Check[] = [
  {
    name: "Constitution defines NutriTail mission",
    pass: hasAll(constitution, [
      "not a generic chatbot",
      "AI-powered pet nutrition platform",
      "Accuracy, safety, and trust",
    ]),
    details: "NutriTail must optimize for safe nutrition intelligence, not generic chatbot cleverness.",
  },
  {
    name: "Constitution locks source of truth hierarchy",
    pass: hasAll(constitution, [
      "Food V2 database",
      "Nutrition rules",
      "Veterinary knowledge",
      "Brand intelligence",
      "User profile",
      "The model is never the source of truth",
    ]),
    details: "Food V2 and rules must remain above the model for facts, nutrients, and ranking.",
  },
  {
    name: "Constitution preserves hybrid architecture",
    pass: hasAll(constitution, [
      "Fact extraction",
      "NutriTail validation",
      "Food V2 retrieval",
      "Nutrition rules",
      "Ranking engine",
      "OpenAI explanation",
    ]),
    details: "OpenAI can extract and explain, but NutriTail validates, retrieves, and ranks.",
  },
  {
    name: "Constitution makes medical safety first",
    pass: hasAll(constitution, [
      "Medical safety overrides everything",
      "medical red flag",
      "stop the normal recommendation flow",
      "never diagnose",
    ]),
    details: "Red flags must interrupt shopping/recommendation flow.",
  },
  {
    name: "Constitution protects conversation quality",
    pass: hasAll(constitution, [
      "one question at a time",
      "never feel robotic",
      "premium pet shop advisor",
      "veterinary nutrition consultant",
    ]),
    details: "The chatbot should feel expert and human without asking unnecessary questions.",
  },
  {
    name: "Constitution rejects weak recommendation reasons",
    pass: hasAll(constitution, [
      "Never recommend a food because it is expensive",
      "grain-free",
      "fashionable",
      "medical fit",
      "nutritional fit",
      "ingredient suitability",
    ]),
    details: "Food choices must be nutrition-driven, not marketing-driven.",
  },
  {
    name: "Constitution puts knowledge into structured assets",
    pass: hasAll(constitution, [
      "convert documents into structured rules",
      "Food V2",
      "Nutrition rules",
      "Brand profiles",
      "Ingredient profiles",
      "Dialogue corpus",
    ]),
    details: "Long-term knowledge belongs in structured data/rules, not long prompts.",
  },
  {
    name: "Constitution requires knowledge gaps to become assets",
    pass: hasAll(constitution, [
      "Knowledge Gap Assetization",
      "knowledge gap or repeating pattern",
      "permanent NutriTail asset",
      "rule",
      "dataset",
      "test",
      "profile",
      "knowledge module",
    ]),
    details:
      "Repeated gaps should become durable NutriTail assets instead of one-off fixes.",
  },
  {
    name: "Constitution requires regression-first testing",
    pass: hasAll(constitution, [
      "Everything important must become a test",
      "Every discovered bug becomes a regression test",
      "Every new disease scenario becomes a dialogue",
      "Every new rule becomes a golden case",
    ]),
    details: "The system should become harder to break after every real mistake.",
  },
  {
    name: "Dialogue corpus README matches constitution",
    pass: hasAll(dialogueReadme, [
      "Database equals truth",
      "NutriTail rules decide safety",
      "OpenAI may extract facts",
      "OpenAI must not invent foods",
    ]),
    details: "The dialogue corpus must remain a grounded QA/training asset, not prompt decoration.",
  },
  {
    name: "AI authority contract matches constitution",
    pass: hasAll(authorityContract, [
      "Food V2",
      "deterministic NutriTail ranking",
      "only source of truth",
      "OpenAI may extract user facts",
      "must not rank foods",
      "invent nutrient values",
    ]),
    details: "Runtime AI contract must keep OpenAI away from ranking and nutrient truth.",
  },
  {
    name: "Prompt instructions keep OpenAI grounded",
    pass: hasAll(promptInstructions, [
      "Do not recommend foods",
      "Use only ranked foods",
      "grounded JSON",
    ]),
    details: "Prompt guidance must reflect the same constitution boundaries.",
  },
  {
    name: "CI readiness includes constitution QA",
    pass:
      packageJson.includes('"qa:project-constitution"') &&
      packageJson.includes("qa:project-constitution && npm run qa:openai-chatbot-training-contract"),
    details: "The constitution must stay protected in the default readiness chain.",
  },
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        checked: checks.length,
        failed: failures,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      checked: checks.length,
      checks: checks.map(({ name, details }) => ({ name, details })),
    },
    null,
    2
  )
);
