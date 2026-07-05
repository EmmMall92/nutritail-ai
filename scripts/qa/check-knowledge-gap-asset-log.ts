import { readFileSync } from "node:fs";

type Check = {
  name: string;
  pass: boolean;
  details?: string;
};

const source = readFileSync("docs/knowledge-gap-asset-log.md", "utf8");

function includesAll(values: string[]) {
  return values.every((value) => source.includes(value));
}

const requiredAssetTypes = [
  "`rule`",
  "`dataset`",
  "`test`",
  "`profile`",
  "`knowledge_module`",
];

const requiredPatterns = [
  "back-office wording",
  "preferred protein",
  "Greek pet-name",
  "comparison intent",
  "Medical red flags",
  "Dog cases 101-200",
  "Cat cases",
  "Wrong size or life-stage",
  "Nutrient gaps",
  "Wet/canned-only requests",
  "brand intelligence",
];

const requiredQaGates = [
  "qa:chatbot-customer-recommendations",
  "qa:customer-recommendation-presentation-contract",
  "qa:food-v2-preference-ranking",
  "qa:chatbot-intake-cleanup",
  "qa:chatbot-safety-interrupts",
  "qa:dialogue-corpus",
  "qa:dog-edge-fixture",
  "qa:dog-chatbot-live-cases",
  "qa:cat-case-fixture",
  "qa:cat-chatbot-live-cases",
  "qa:missing-format-recommendation-message",
];

const checks: Check[] = [
  {
    name: "Knowledge gap log defines permanent asset types",
    pass: includesAll(requiredAssetTypes),
    details: requiredAssetTypes.join(", "),
  },
  {
    name: "Knowledge gap log covers the current top 10 task patterns",
    pass: includesAll(requiredPatterns),
    details: requiredPatterns.join(", "),
  },
  {
    name: "Knowledge gap log maps patterns to QA gates",
    pass: includesAll(requiredQaGates),
    details: requiredQaGates.join(", "),
  },
  {
    name: "Knowledge gap log requires durable asset ownership before one-off fixes",
    pass:
      source.includes("Pick the durable asset owner") &&
      source.includes("Only then apply the immediate code/data fix"),
  },
];

const failed = checks.filter((check) => !check.pass);

console.log(
  JSON.stringify(
    {
      checked: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      checks,
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exit(1);
}
