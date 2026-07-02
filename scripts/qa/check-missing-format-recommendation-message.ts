import { formatMissingFormatRecommendationMessage } from "@/lib/food-v2/missingFormatRecommendationMessage";

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
  "Δεν θα σου προτείνω ξηρά τροφή",
  "Greek wet dog format fallback"
);
assertIncludes(greekWetDog, "Καλύτερο επόμενο βήμα", "Greek wet dog next step");
assertIncludes(
  greekWetDog,
  "δεν τις δείχνω γιατί δεν ταιριάζουν",
  "Greek wet dog held-candidate explanation"
);
assertNotIncludes(greekWetDog, "source:", "Greek wet dog customer copy");
assertNotIncludes(greekWetDog, "needs_review", "Greek wet dog customer copy");

const englishWetDog = formatMissingFormatRecommendationMessage({
  pet: { species: "dog", preferredFoodFormat: "wet" },
  language: "en",
  coverage: { totalCandidates: 0, heldCandidates: 0 },
});

assertIncludes(
  englishWetDog,
  "I will not recommend dry food",
  "English wet dog format fallback"
);
assertIncludes(
  englishWetDog,
  "coverage gap",
  "English wet dog coverage explanation"
);

const greekMixed = formatMissingFormatRecommendationMessage({
  pet: { species: "cat", preferredFoodFormat: "mixed" },
  language: "el",
  coverage: { totalCandidates: 0, heldCandidates: 0 },
});

assertIncludes(greekMixed, "βάση", "Greek mixed base-food guidance");
assertIncludes(greekMixed, "topper", "Greek mixed topper guidance");

console.log("Missing format recommendation message QA passed.");
