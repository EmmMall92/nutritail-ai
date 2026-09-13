import { readFileSync } from "node:fs";
import { localizeNutritionAdviceNotes } from "../../lib/chatbot/nutritionAdvicePresentation";
import {
  formatCustomerActivity,
  formatCustomerBreed,
  formatCustomerSpecies,
  formatCustomerWeightGoal,
} from "../../lib/petCustomerLabels";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const timelineSource = readFileSync(
  "app/print/pet-timeline/[id]/page.tsx",
  "utf8"
);
const legacyReportSource = readFileSync("app/print/pet-report/page.tsx", "utf8");
const supabaseAdminSource = readFileSync("lib/db/supabaseAdmin.ts", "utf8");

for (const forbiddenMarker of ["petAnalysisService", ".analyzePet("]) {
  assert(
    !timelineSource.includes(forbiddenMarker),
    `Pet timeline must not run server-only analysis in the browser: ${forbiddenMarker}`
  );
  assert(
    !legacyReportSource.includes(forbiddenMarker),
    `Legacy pet report must not run server-only analysis in the browser: ${forbiddenMarker}`
  );
}

assert(
  legacyReportSource.includes('fetch("/api/analysis"'),
  "Legacy pet report must request analysis through the server API."
);

for (const requiredMarker of [
  'data-testid="pet-timeline-saved-plan"',
  "latestHistory?.matchedFoodName",
  "latestHistory?.feedingGramsPerDay",
  "formatCustomerWeightGoal(latestHistory?.weightGoal)",
  "Το κατοικίδιο δεν βρέθηκε ή έχει αφαιρεθεί από τον λογαριασμό.",
]) {
  assert(
    timelineSource.includes(requiredMarker),
    `Pet timeline must render saved plan data: ${requiredMarker}`
  );
}

assert(
  !timelineSource.includes("String(printResult.error"),
  "Pet timeline must not expose raw server errors to customers."
);

assert(
  supabaseAdminSource.includes('import "server-only"'),
  "Supabase admin client must be protected from browser imports."
);

for (const [actual, expected] of [
  [formatCustomerSpecies("dog"), "Σκύλος"],
  [formatCustomerSpecies("cat"), "Γάτα"],
  [formatCustomerBreed("unknown"), "Δεν δηλώθηκε"],
  [formatCustomerActivity("normal"), "Κανονική"],
  [formatCustomerWeightGoal("maintain"), "Διατήρηση βάρους"],
  [formatCustomerWeightGoal("maintenance"), "Διατήρηση βάρους"],
] as const) {
  assert(actual === expected, `Expected customer label ${expected}, got ${actual}.`);
}

assert(
  localizeNutritionAdviceNotes(
    "Weight Control: Neutered pets need measured portions.",
    "el"
  ).startsWith("Έλεγχος βάρους:"),
  "Saved nutrition notes must be localized for the Greek timeline."
);

console.log("Pet timeline saved data contract passed.");
