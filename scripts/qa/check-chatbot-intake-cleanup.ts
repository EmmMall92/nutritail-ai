import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import { fallbackExtractIntake } from "@/lib/ai/intakeFallback";
import { readFileSync } from "node:fs";
import {
  parseTastePreferences,
  removeExcludedFromPreferred,
} from "@/lib/chatbot/tastePreferences";
import {
  formatCustomerPetName,
  formatPetDisplayName,
  isTechnicalPetName,
} from "@/lib/petName";

type Check = {
  name: string;
  pass: boolean;
  details?: string;
};

function hasAll(values: string[] | undefined, expected: string[]) {
  return expected.every((value) => values?.includes(value));
}

function runChecks(): Check[] {
  const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");
  const accountPage = readFileSync("app/account/page.tsx", "utf8");
  const accountPetsPage = readFileSync("app/account/pets/page.tsx", "utf8");
  const accountPetDetailPage = readFileSync("app/account/pets/[id]/page.tsx", "utf8");
  const legacyPrintableReportPage = readFileSync("app/print/pet-report/page.tsx", "utf8");
  const printableReportPage = readFileSync("app/print/pet-report/[id]/page.tsx", "utf8");
  const printableTimelinePage = readFileSync("app/print/pet-timeline/[id]/page.tsx", "utf8");
  const greekKyrki = "\u03c4\u03b7\u03bd \u03bb\u03b5\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7";
  const greekKyrkiWithAccent =
    "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7";
  const greekKyrkiRepeatedArticle =
    "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u03c4\u03b7\u03bd \u039a\u03cd\u03c1\u03ba\u03b7";
  const greekDogNamedLeonidas =
    "\u03bf \u03c3\u03ba\u03cd\u03bb\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9 \u03bb\u03ad\u03c9\u03bd\u03b9\u03b4\u03b1\u03c2";
  const chickenYesSalmonNo =
    "\u03a4\u03b7\u03c2 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03ba\u03b1\u03b8\u03bf\u03bb\u03bf\u03c5 \u03bf \u03c3\u03bf\u03bb\u03bf\u03bc\u03bf\u03c2";
  const chickenYesLambBeefNo =
    "\u03c4\u03bf\u03c5 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03c1\u03c9\u03b5\u03b9 \u03c4\u03bf \u03b1\u03c1\u03bd\u03b9 \u03ba\u03b1\u03b9 \u03c4\u03bf \u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9";
  const greeklishChickenYesLambBeefNo =
    "tou aresei to kotopoulo kai den troei arni kai mosxari";
  const englishLovesSalmonRefusesBeefLamb =
    "adult cat loves salmon but refuses beef and lamb";

  const parsedSalmon = parseTastePreferences(chickenYesSalmonNo);
  const parsedLambBeef = parseTastePreferences(chickenYesLambBeefNo);
  const parsedGreeklishLambBeef = parseTastePreferences(greeklishChickenYesLambBeefNo);
  const parsedEnglishRefuses = parseTastePreferences(englishLovesSalmonRefusesBeefLamb);
  const fallbackGreatDane = fallbackExtractIntake(
    "Έχω Great Dane 7 μηνών 45kg και θέλω τροφή για ανάπτυξη."
  );
  const fallbackDislikedSalmon = fallbackExtractIntake(
    "Δεν ξέρω την τροφή του. Του αρέσει κοτόπουλο και δεν τρώει σολομό."
  );
  const validatedConflict = validateAiIntakeExtraction({
    petName: greekKyrki,
    currentFoodName: "σολομός",
    preferredProteins: ["chicken", "salmon"],
    excludedIngredients: ["salmon"],
    confidence: "medium",
  });
  const reconciled = removeExcludedFromPreferred(["chicken", "salmon"], ["salmon"]);
  const fallbackGreeklishPreferences = fallbackExtractIntake(
    "den ksero tin trofi. tou aresei to kotopoulo kai den troei arni kai mosxari"
  );
  const fallbackGreeklishDigestive = fallbackExtractIntake(
    "to skylaki mou kanei malaka kaka kai aera"
  );
  const fallbackPuppyBloodDiarrhea = fallbackExtractIntake(
    "\u039f \u03c3\u03ba\u03cd\u03bb\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03ad\u03c7\u03b5\u03b9 \u03b4\u03b9\u03ac\u03c1\u03c1\u03bf\u03b9\u03b1 \u03bc\u03b5 \u03b1\u03af\u03bc\u03b1 \u03ba\u03b1\u03b9 \u03b5\u03af\u03bd\u03b1\u03b9 \u03ba\u03bf\u03c5\u03c4\u03ac\u03b2\u03b9."
  );

  return [
    {
      name: "Chatbot intake extraction is scoped to the active question",
      pass:
        chatbotPage.includes("function getAllowedExtractedFieldsForStep") &&
        chatbotPage.includes("allowedExtractedFields") &&
        chatbotPage.includes("activityLevel: false") &&
        chatbotPage.includes('if (step === "activity") return { ...base, activityLevel: true };') &&
        chatbotPage.includes("mergeExtractedPetFacts(pet, intakeExtraction?.data, allowedExtractedFields)"),
      details:
        "Prevents OpenAI/fallback extraction from skipping activity or neuter questions from unrelated answers.",
    },
    {
      name: "Fallback infers dog species from Great Dane breed",
      pass:
        fallbackGreatDane.data.species === "dog" &&
        fallbackGreatDane.data.weightKg === 45,
      details: JSON.stringify(fallbackGreatDane.data),
    },
    {
      name: "Fallback does not turn disliked salmon into current food",
      pass:
        fallbackDislikedSalmon.data.currentFoodName == null &&
        hasAll(fallbackDislikedSalmon.data.preferredProteins, ["chicken"]) &&
        hasAll(fallbackDislikedSalmon.data.excludedIngredients, ["salmon"]),
      details: JSON.stringify(fallbackDislikedSalmon.data),
    },
    {
      name: "Greek pet name strips natural phrase without accent",
      pass: formatPetDisplayName(greekKyrki) === "\u039a\u03cd\u03c1\u03ba\u03b7",
      details: formatPetDisplayName(greekKyrki),
    },
    {
      name: "Greek pet name strips natural phrase with accent",
      pass: formatPetDisplayName(greekKyrkiWithAccent) === "\u039a\u03cd\u03c1\u03ba\u03b7",
      details: formatPetDisplayName(greekKyrkiWithAccent),
    },
    {
      name: "Greek pet name strips repeated article after natural phrase",
      pass: formatPetDisplayName(greekKyrkiRepeatedArticle) === "\u039a\u03cd\u03c1\u03ba\u03b7",
      details: formatPetDisplayName(greekKyrkiRepeatedArticle),
    },
    {
      name: "Greek pet name strips species-owner named phrase",
      pass: formatPetDisplayName(greekDogNamedLeonidas) === "\u039b\u03b5\u03c9\u03bd\u03af\u03b4\u03b1\u03c2",
      details: formatPetDisplayName(greekDogNamedLeonidas),
    },
    {
      name: "Greek pet name title-cases and accents direct lowercase known names",
      pass:
        formatPetDisplayName("\u03bb\u03b5\u03c9\u03bd\u03b9\u03b4\u03b1\u03c2") === "\u039b\u03b5\u03c9\u03bd\u03af\u03b4\u03b1\u03c2" &&
        formatPetDisplayName("\u03bc\u03c0\u03b5\u03bc\u03c0\u03b1") === "\u039c\u03c0\u03ad\u03bc\u03c0\u03b1" &&
        formatPetDisplayName("\u03ba\u03bb\u03b5\u03bf\u03bc\u03b5\u03bd\u03b7\u03c2") === "\u039a\u03bb\u03b5\u03bf\u03bc\u03ad\u03bd\u03b7\u03c2",
      details: JSON.stringify({
        leonidas: formatPetDisplayName("\u03bb\u03b5\u03c9\u03bd\u03b9\u03b4\u03b1\u03c2"),
        bempa: formatPetDisplayName("\u03bc\u03c0\u03b5\u03bc\u03c0\u03b1"),
        kleomenis: formatPetDisplayName("\u03ba\u03bb\u03b5\u03bf\u03bc\u03b5\u03bd\u03b7\u03c2"),
      }),
    },
    {
      name: "English pet name strips natural named phrase",
      pass: formatPetDisplayName("my dog is named luna") === "Luna",
      details: formatPetDisplayName("my dog is named luna"),
    },
    {
      name: "Technical QA pet names are detected",
      pass:
        isTechnicalPetName("QA Live Proof 202607031752") &&
        isTechnicalPetName("qa live proof") &&
        !isTechnicalPetName("\u039a\u03cd\u03c1\u03ba\u03b7") &&
        formatCustomerPetName("QA Live Proof 202607031752") === "Κατοικίδιο",
      details: JSON.stringify({
        qaLiveProof: isTechnicalPetName("QA Live Proof 202607031752"),
        customerName: formatCustomerPetName("QA Live Proof 202607031752"),
        kyrki: isTechnicalPetName("\u039a\u03cd\u03c1\u03ba\u03b7"),
      }),
    },
    {
      name: "Customer account surfaces use safe pet display names",
      pass:
        chatbotPage.includes("formatCustomerPetName(") &&
        accountPage.includes("formatCustomerPetName(") &&
        accountPetsPage.includes("formatCustomerPetName(") &&
        accountPetDetailPage.includes("formatCustomerPetName(") &&
        legacyPrintableReportPage.includes("formatCustomerPetName(") &&
        printableReportPage.includes("formatCustomerPetName(") &&
        printableTimelinePage.includes("formatCustomerPetName("),
      details:
        "Prevents technical live-QA pet names from leaking into account, report, and timeline surfaces.",
    },
    {
      name: "Customer chatbot hides technical QA pets from saved pet choices",
      pass:
        chatbotPage.includes("!isTechnicalPetName(savedPet.name)") &&
        chatbotPage.includes("formatCustomerPetName(pet.name"),
      details:
        "Prevents live QA proof pets from appearing as customer pet names in the chatbot surface.",
    },
    {
      name: "Customer chatbot asks for budget before flavor preferences",
      pass:
        chatbotPage.includes('| "budget"') &&
        chatbotPage.includes("budgetMaxEuro?: number") &&
        chatbotPage.includes("budgetAnswered?: boolean") &&
        chatbotPage.includes('if (!draft.budgetAnswered) return "budget";') &&
        chatbotPage.indexOf('return "budget";') < chatbotPage.indexOf('return "preferences";'),
      details:
        "Budget is captured as conversation context before taste/protein preferences, without requiring a schema change.",
    },
    {
      name: "Customer chatbot summarizes budget for review before analysis",
      pass:
        chatbotPage.includes("parseBudgetMaxEuro") &&
        chatbotPage.includes("isNoBudgetAnswer") &&
        chatbotPage.includes("Budget: up to about") &&
        chatbotPage.includes("Budget: no strict limit"),
      details:
        "The customer can see the captured budget in the review summary before recommendations.",
    },
    {
      name: "Preferences keep liked chicken and avoid disliked salmon",
      pass:
        hasAll(parsedSalmon.preferredProteins, ["chicken"]) &&
        hasAll(parsedSalmon.excludedIngredients, ["salmon"]) &&
        !parsedSalmon.preferredProteins.includes("salmon"),
      details: JSON.stringify(parsedSalmon),
    },
    {
      name: "Preferences keep chicken and avoid lamb plus beef",
      pass:
        hasAll(parsedLambBeef.preferredProteins, ["chicken"]) &&
        hasAll(parsedLambBeef.excludedIngredients, ["lamb", "beef"]) &&
        !parsedLambBeef.preferredProteins.includes("lamb") &&
        !parsedLambBeef.preferredProteins.includes("beef"),
      details: JSON.stringify(parsedLambBeef),
    },
    {
      name: "Greeklish preferences keep chicken and avoid lamb plus beef",
      pass:
        hasAll(parsedGreeklishLambBeef.preferredProteins, ["chicken"]) &&
        hasAll(parsedGreeklishLambBeef.excludedIngredients, ["lamb", "beef"]) &&
        !parsedGreeklishLambBeef.preferredProteins.includes("lamb") &&
        !parsedGreeklishLambBeef.preferredProteins.includes("beef"),
      details: JSON.stringify(parsedGreeklishLambBeef),
    },
    {
      name: "English preferences keep loved salmon and avoid refused beef plus lamb",
      pass:
        hasAll(parsedEnglishRefuses.preferredProteins, ["salmon"]) &&
        hasAll(parsedEnglishRefuses.excludedIngredients, ["beef", "lamb"]) &&
        !parsedEnglishRefuses.preferredProteins.includes("beef") &&
        !parsedEnglishRefuses.preferredProteins.includes("lamb"),
      details: JSON.stringify(parsedEnglishRefuses),
    },
    {
      name: "Fallback handles Greeklish unknown food plus preferences",
      pass:
        fallbackGreeklishPreferences.data.currentFoodName == null &&
        hasAll(fallbackGreeklishPreferences.data.preferredProteins, ["chicken"]) &&
        hasAll(fallbackGreeklishPreferences.data.excludedIngredients, ["lamb", "beef"]),
      details: JSON.stringify(fallbackGreeklishPreferences.data),
    },
    {
      name: "Fallback handles Greeklish dog digestive message",
      pass:
        fallbackGreeklishDigestive.data.species === "dog" &&
        fallbackGreeklishDigestive.data.petName == null &&
        fallbackGreeklishDigestive.data.language === "el" &&
        hasAll(fallbackGreeklishDigestive.data.healthIssues, ["sensitive_digestion"]),
      details: JSON.stringify(fallbackGreeklishDigestive.data),
    },
    {
      name: "Fallback keeps puppy context for red-flag diarrhea message",
      pass:
        fallbackPuppyBloodDiarrhea.data.species === "dog" &&
        fallbackPuppyBloodDiarrhea.data.ageYears === 0.4 &&
        hasAll(fallbackPuppyBloodDiarrhea.data.redFlags, ["blood"]),
      details: JSON.stringify(fallbackPuppyBloodDiarrhea.data),
    },
    {
      name: "Validation removes OpenAI preference conflicts",
      pass:
        validatedConflict.data.petName === "\u039a\u03cd\u03c1\u03ba\u03b7" &&
        validatedConflict.data.currentFoodName == null &&
        hasAll(validatedConflict.data.preferredProteins, ["chicken"]) &&
        hasAll(validatedConflict.data.excludedIngredients, ["salmon"]) &&
        !validatedConflict.data.preferredProteins?.includes("salmon"),
      details: JSON.stringify(validatedConflict.data),
    },
    {
      name: "Preference reconciliation removes excluded proteins",
      pass: reconciled.length === 1 && reconciled[0] === "chicken",
      details: JSON.stringify(reconciled),
    },
  ];
}

const results = runChecks();
const failed = results.filter((result) => !result.pass);

console.log(
  JSON.stringify(
    {
      checked: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      results,
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exit(1);
}
