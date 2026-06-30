import { parseProgressUpdate } from "../../lib/chatbot/progressParsing";

type Expected = {
  text: string;
  weight?: number | null;
  grams?: number | null;
  treats?: string | null;
  appetite?: string | null;
  stool?: string | null;
  energy?: string | null;
  enough?: boolean;
  missing?: string[];
};

const cases: Expected[] = [
  {
    text: "τώρα είναι 6,4 κιλά, τρώει 70γρ, λίγες λιχουδιές, καλή όρεξη, καλύτερα κόπρανα και περισσότερη ενέργεια",
    weight: 6.4,
    grams: 70,
    treats: "few",
    appetite: "normal",
    stool: "better",
    energy: "better",
    enough: true,
    missing: [],
  },
  {
    text: "7 κιλά και 70 γραμμάρια",
    weight: 7,
    grams: 70,
    enough: false,
    missing: ["treats", "appetite", "stool", "energy"],
  },
  {
    text: "now 6.4 kg, 70 grams per day, no treats, normal appetite, soft stool, low energy",
    weight: 6.4,
    grams: 70,
    treats: "none",
    appetite: "normal",
    stool: "soft",
    energy: "low",
    enough: true,
    missing: [],
  },
  {
    text: "70γρ τη μέρα",
    weight: null,
    grams: 70,
    enough: false,
  },
  {
    text: "τώρα 6,4 κιλά και τρώει 70 γραμμάρια τη μέρα",
    weight: 6.4,
    grams: 70,
    enough: false,
    missing: ["treats", "appetite", "stool", "energy"],
  },
  {
    text: "70 γραμμαρια την ημερα",
    weight: null,
    grams: 70,
    enough: false,
  },
  {
    text: "7κιλα",
    weight: 7,
    grams: null,
    enough: false,
  },
  {
    text: "παίρνει πολλές λιχουδιές, πεινάει συνέχεια, μαλακά κακά και χαμηλή ενέργεια",
    treats: "many",
    appetite: "hungry",
    stool: "soft",
    energy: "low",
    enough: false,
  },
];

const failures: string[] = [];

for (const testCase of cases) {
  const result = parseProgressUpdate(testCase.text);

  assertEqual(testCase.text, "currentWeightKg", result.currentWeightKg, testCase.weight);
  assertEqual(
    testCase.text,
    "feedingGramsPerDay",
    result.feedingGramsPerDay,
    testCase.grams
  );
  assertEqual(testCase.text, "treatsNote", result.treatsNote, testCase.treats);
  assertEqual(testCase.text, "appetiteNote", result.appetiteNote, testCase.appetite);
  assertEqual(testCase.text, "stoolNote", result.stoolNote, testCase.stool);
  assertEqual(testCase.text, "energyNote", result.energyNote, testCase.energy);
  assertEqual(
    testCase.text,
    "hasEnoughProgressContext",
    result.hasEnoughProgressContext,
    testCase.enough
  );

  if (testCase.missing) {
    const actual = result.missingFollowUpFields.join(",");
    const expected = testCase.missing.join(",");
    if (actual !== expected) {
      failures.push(
        `${testCase.text}: missingFollowUpFields expected ${expected}, got ${actual}`
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Chatbot progress parsing QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Chatbot progress parsing QA passed (${cases.length}/${cases.length}).`);

function assertEqual(
  text: string,
  field: string,
  actual: unknown,
  expected: unknown
) {
  if (expected === undefined) return;
  if (actual !== expected) {
    failures.push(`${text}: ${field} expected ${expected}, got ${actual}`);
  }
}
