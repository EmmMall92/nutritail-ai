import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const packageJson = read("package.json");
const smokeRunner = read("scripts/qa/run-chatbot-sensitive-recommendation-smoke.mjs");

const requiredSuites = [
  "Cat ranking balance",
  "Senior visible ranking",
  "Food preference and puppy ranking",
  "Food V2 ranking scenarios",
  "Dog live smoke",
  "Cat live safety",
];

assert(
  packageJson.includes("\"qa:chatbot-sensitive-recommendations\""),
  "package.json must expose the launch-sensitive recommendation smoke command."
);
assert(
  packageJson.includes("\"qa:launch-recommendation-contract\""),
  "package.json must expose this launch recommendation QA contract."
);
assert(
  packageJson.includes("qa:launch-recommendation-contract && npm run qa:pr-quality-policy"),
  "CI readiness must include the lightweight launch recommendation QA contract."
);
assert(
  smokeRunner.includes("reports/chatbot_sensitive_recommendation_smoke.md"),
  "Sensitive recommendation smoke must write an auditable launch QA report."
);

for (const suite of requiredSuites) {
  assert(
    smokeRunner.includes(`name: "${suite}"`),
    `Sensitive recommendation smoke must include the ${suite} suite.`
  );
}

assert(
  smokeRunner.includes("live dog recommendation endpoint"),
  "Sensitive recommendation smoke must cover live dog endpoint behavior."
);
assert(
  smokeRunner.includes("live cat emergency"),
  "Sensitive recommendation smoke must cover live cat safety behavior."
);
assert(
  smokeRunner.includes("large-breed puppy guards"),
  "Sensitive recommendation smoke must cover large-breed puppy guard behavior."
);
assert(
  smokeRunner.includes("urinary/renal mismatch guards"),
  "Sensitive recommendation smoke must cover urinary and renal mismatch guards."
);

console.log("Launch recommendation QA contract passed.");
