import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import {
  parseTastePreferences,
  removeExcludedFromPreferred,
} from "@/lib/chatbot/tastePreferences";
import { formatPetDisplayName } from "@/lib/petName";

type Check = {
  name: string;
  pass: boolean;
  details?: string;
};

function hasAll(values: string[] | undefined, expected: string[]) {
  return expected.every((value) => values?.includes(value));
}

function runChecks(): Check[] {
  const greekKyrki = "\u03c4\u03b7\u03bd \u03bb\u03b5\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7";
  const greekKyrkiWithAccent =
    "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7";
  const chickenYesSalmonNo =
    "\u03a4\u03b7\u03c2 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03ba\u03b1\u03b8\u03bf\u03bb\u03bf\u03c5 \u03bf \u03c3\u03bf\u03bb\u03bf\u03bc\u03bf\u03c2";
  const chickenYesLambBeefNo =
    "\u03c4\u03bf\u03c5 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03c1\u03c9\u03b5\u03b9 \u03c4\u03bf \u03b1\u03c1\u03bd\u03b9 \u03ba\u03b1\u03b9 \u03c4\u03bf \u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9";

  const parsedSalmon = parseTastePreferences(chickenYesSalmonNo);
  const parsedLambBeef = parseTastePreferences(chickenYesLambBeefNo);
  const validatedConflict = validateAiIntakeExtraction({
    petName: greekKyrki,
    preferredProteins: ["chicken", "salmon"],
    excludedIngredients: ["salmon"],
    confidence: "medium",
  });
  const reconciled = removeExcludedFromPreferred(["chicken", "salmon"], ["salmon"]);

  return [
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
      name: "Validation removes OpenAI preference conflicts",
      pass:
        validatedConflict.data.petName === "\u039a\u03cd\u03c1\u03ba\u03b7" &&
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
