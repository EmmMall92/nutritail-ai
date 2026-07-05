import { buildProgressDecision } from "../../lib/chatbot/progressDecision";
import { parseProgressUpdate } from "../../lib/chatbot/progressParsing";

const cases = [
  {
    name: "enough positive context continues plan",
    text: "now 6.4 kg, 70 grams per day, few treats, normal appetite, better stool, better energy",
    previousWeightKg: 6.6,
    expectedStatus: "continue_plan",
  },
  {
    name: "many treats are adjusted before changing food",
    text: "now 7 kg, 70 grams per day, many treats, normal appetite, normal stool, normal energy",
    previousWeightKg: 7,
    expectedStatus: "reduce_treats",
  },
  {
    name: "low appetite and diarrhea trigger food fit review",
    text: "now 7 kg, 70 grams per day, no treats, low appetite, diarrhea, low energy",
    previousWeightKg: 7,
    expectedStatus: "review_food_fit",
  },
  {
    name: "missing context asks for more data",
    text: "7 kg and 70 grams",
    previousWeightKg: 7,
    expectedStatus: "needs_more_data",
  },
  {
    name: "no result mode asks for portion adjustment",
    text: "now 7 kg, 70 grams per day, no treats, normal appetite, normal stool, normal energy",
    previousWeightKg: 7,
    mode: "no_result" as const,
    expectedStatus: "adjust_portions",
  },
  {
    name: "food boredom triggers food fit review",
    text: "τώρα είναι 6 κιλά, 70γρ, λίγες λιχουδιές, καλή όρεξη, κανονικά κόπρανα, κανονική ενέργεια αλλά βαρέθηκε τη γεύση",
    previousWeightKg: 6,
    expectedStatus: "review_food_fit",
  },
  {
    name: "food refusal triggers food fit review",
    text: "now 6 kg, 70 grams per day, no treats, normal appetite, normal stool, normal energy, refuses this food",
    previousWeightKg: 6,
    expectedStatus: "review_food_fit",
  },
];

const failures: string[] = [];

for (const testCase of cases) {
  const details = parseProgressUpdate(testCase.text);
  const decision = buildProgressDecision({
    details,
    previousWeightKg: testCase.previousWeightKg,
    mode: testCase.mode ?? "progress",
  });

  if (decision.status !== testCase.expectedStatus) {
    failures.push(
      `${testCase.name}: expected ${testCase.expectedStatus}, got ${decision.status}`
    );
  }

  if (!decision.headline.el || !decision.headline.en) {
    failures.push(`${testCase.name}: missing bilingual headline`);
  }

  if (decision.reasons.el.length === 0 || decision.nextSteps.en.length === 0) {
    failures.push(`${testCase.name}: missing reasons or next steps`);
  }
}

if (failures.length > 0) {
  console.error("Chatbot progress decision QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Chatbot progress decision QA passed (${cases.length}/${cases.length}).`);
