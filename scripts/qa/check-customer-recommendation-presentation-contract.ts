import {
  buildCustomerRecommendationIntro,
  customerRecommendationPresentationForbiddenTerms,
} from "@/lib/food-v2/customerRecommendationPresentation";
import { readFileSync } from "node:fs";

const greekIntro = buildCustomerRecommendationIntro({
  language: "el",
  mode: "default",
  choices: [
    { name: "Royal Canin Mini Sterilised", role: "best" },
    { name: "Farmina N&D Quinoa Neutered Mini", role: "best" },
    { name: "Josera Miniwell Adult", role: "best" },
    { name: "Happy Dog NaturCroq Sterilised", role: "value" },
    { name: "Brit Care Mini Light", role: "value" },
    { name: "Schesir Small Adult Chicken", role: "value" },
  ],
});

const englishIntro = buildCustomerRecommendationIntro({
  language: "en",
  mode: "alternative",
  choices: [
    { name: "Acana Adult Small Breed", role: "best" },
    { name: "Josera Sensi Plus Adult", role: "value" },
  ],
});

const requiredGreekCopy = [
  "Βρήκα τις πιο κατάλληλες επιλογές",
  "κάρτες",
  "3 δυνατές επιλογές",
  "3 πιο πρακτικές/οικονομικές εναλλακτικές",
  "Πρώτη πρόταση",
  "γραμμάρια/ημέρα",
  "ξεκάθαρο πλάνο",
];

const requiredEnglishCopy = [
  "new options",
  "current food",
  "First pick",
  "grams/day",
  "strong picks",
  "practical/value alternatives",
];

const forbiddenTerms = customerRecommendationPresentationForbiddenTerms();
const responseComposerSource = readFileSync("lib/ai/responseComposer.ts", "utf8");

function assertIncludes(label: string, text: string, required: string[]) {
  const missing = required.filter((term) => !text.includes(term));
  if (missing.length > 0) {
    console.error(`${label} is missing required customer-facing copy:`);
    console.error(missing.join(", "));
    console.error(text);
    process.exit(1);
  }
}

function assertNoForbiddenTerms(label: string, text: string) {
  const lower = text.toLowerCase();
  const found = [
    ...forbiddenTerms,
    "source:",
    "quality:",
    "needs review",
  ].filter((term) => lower.includes(term.toLowerCase()));
  if (found.length > 0) {
    console.error(`${label} leaked back-office wording:`);
    console.error(found.join(", "));
    console.error(text);
    process.exit(1);
  }
}

function assertShort(label: string, text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > 90) {
    console.error(`${label} should stay compact before the food cards.`);
    console.error(`Words: ${words.length}`);
    console.error(text);
    process.exit(1);
  }
}

function assertNoMojibake(label: string, text: string) {
  if (/[ΞΟ][\u0080-\u00ff]|�/.test(text)) {
    console.error(`${label} contains customer-visible mojibake:`);
    console.error(text);
    process.exit(1);
  }
}

assertIncludes("Greek recommendation intro", greekIntro, requiredGreekCopy);
assertIncludes("English recommendation intro", englishIntro, requiredEnglishCopy);
assertNoForbiddenTerms("Greek recommendation intro", greekIntro);
assertNoForbiddenTerms("English recommendation intro", englishIntro);
assertNoMojibake("Greek recommendation intro", greekIntro);
assertShort("Greek recommendation intro", greekIntro);
assertShort("English recommendation intro", englishIntro);

if (
  !responseComposerSource.includes("buildCustomerRecommendationIntro") ||
  !responseComposerSource.includes("buildCardIntroFallback") ||
  !responseComposerSource.includes("cardIntro || buildCustomerFallbackText(input)")
) {
  console.error(
    "OpenAI recommendation composer fallback must reuse the shared customer card intro."
  );
  process.exit(1);
}

console.log("Customer recommendation presentation contract passed.");
