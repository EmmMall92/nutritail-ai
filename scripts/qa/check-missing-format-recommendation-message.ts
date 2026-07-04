import { formatMissingFormatRecommendationMessage } from "@/lib/food-v2/missingFormatRecommendationMessage";
import { readFileSync } from "node:fs";

function assertIncludes(text: string, expected: string, label: string) {
  if (!text.includes(expected)) {
    console.error(`Missing expected text for ${label}: ${expected}`);
    console.error(text);
    process.exit(1);
  }
}

function assertNotIncludes(text: string, unexpected: string, label: string) {
  if (text.includes(unexpected)) {
    console.error(`Unexpected text for ${label}: ${unexpected}`);
    console.error(text);
    process.exit(1);
  }
}

const greekWetDog = formatMissingFormatRecommendationMessage({
  pet: { species: "dog", preferredFoodFormat: "wet" },
  language: "el",
  coverage: { totalCandidates: 1, heldCandidates: 1 },
});

assertIncludes(
  greekWetDog,
  "δεν έχω αρκετές υγρές τροφές/κονσέρβες",
  "Greek wet dog customer fallback"
);
assertIncludes(greekWetDog, "αξιόπιστη κατάταξη", "Greek wet dog ranking clarity");
assertIncludes(greekWetDog, "Καλύτερο επόμενο βήμα", "Greek wet dog next step");
assertIncludes(greekWetDog, "θερμίδες", "Greek wet dog calorie guidance");
assertIncludes(greekWetDog, "ποσότητα/ημέρα", "Greek wet dog daily portion guidance");
assertNotIncludes(greekWetDog, "source:", "Greek wet dog customer copy");
assertNotIncludes(greekWetDog, "needs_review", "Greek wet dog customer copy");
assertNotIncludes(greekWetDog, "data coverage gap", "Greek wet dog customer copy");
assertNotIncludes(greekWetDog, "Δεν θα σου προτείνω ξηρά τροφή", "Greek wet dog customer copy");

const englishWetDog = formatMissingFormatRecommendationMessage({
  pet: { species: "dog", preferredFoodFormat: "wet" },
  language: "en",
  coverage: { totalCandidates: 0, heldCandidates: 0 },
});

assertIncludes(
  englishWetDog,
  "do not yet have enough wet/canned foods",
  "English wet dog customer fallback"
);
assertIncludes(
  englishWetDog,
  "rank them reliably",
  "English wet dog ranking clarity"
);
assertIncludes(
  englishWetDog,
  "Best next step",
  "English wet dog next step"
);
assertNotIncludes(englishWetDog, "I will not recommend dry food", "English wet dog customer copy");
assertNotIncludes(englishWetDog, "needs_review", "English wet dog customer copy");

const greekMixed = formatMissingFormatRecommendationMessage({
  pet: { species: "cat", preferredFoodFormat: "mixed" },
  language: "el",
  coverage: { totalCandidates: 0, heldCandidates: 0 },
});

assertIncludes(greekMixed, "βάση", "Greek mixed base-food guidance");
assertIncludes(greekMixed, "topper", "Greek mixed topper guidance");
assertIncludes(greekMixed, "σωστές θερμίδες και μερίδα", "Greek mixed portion guidance");

const dogLiveRunner = readFileSync("scripts/qa/run-dog-chatbot-live-cases.ts", "utf8");
const catLiveRunner = readFileSync("scripts/qa/run-cat-chatbot-live-cases.ts", "utf8");

assertIncludes(
  dogLiveRunner,
  "DOCUMENTED_WET_DATA_GAP",
  "Dog live QA should classify wet-only empty results as documented data gaps"
);
assertIncludes(
  dogLiveRunner,
  "isDocumentedFormatDataGap",
  "Dog live QA should separate documented wet data gaps from blocking review warnings"
);
assertIncludes(
  dogLiveRunner,
  "blockingWarnings.length === 0",
  "Dog live QA should pass when only the documented wet data gap is present"
);

assertIncludes(
  catLiveRunner,
  "DOCUMENTED_WET_DATA_GAP",
  "Cat live QA should classify wet-only empty results as documented data gaps"
);
assertIncludes(
  catLiveRunner,
  "isDocumentedFormatDataGap",
  "Cat live QA should separate documented wet data gaps from blocking review warnings"
);
assertIncludes(
  catLiveRunner,
  "blockingWarnings.length === 0",
  "Cat live QA should pass when only the documented wet data gap is present"
);

console.log("Missing format recommendation message QA passed.");
