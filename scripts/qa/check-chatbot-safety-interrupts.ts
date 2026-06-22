import {
  detectSafetyWarnings,
  hasHardStop,
  type ChatbotSafetyWarning,
} from "../../lib/chatbot/safetyRules";

type SafetyCase = {
  id: string;
  message: string;
  species?: "dog" | "cat";
  expectedHardStop: boolean;
  expectedCode?: string;
};

const cases: SafetyCase[] = [
  {
    id: "male-cat-no-urine-el",
    message: "Αρσενικός γάτος που προσπαθεί να ουρήσει και δεν μπορεί",
    species: "cat",
    expectedHardStop: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "blood-urine-el",
    message: "Γάτα με αίμα στα ούρα",
    species: "cat",
    expectedHardStop: true,
    expectedCode: "blood_seen",
  },
  {
    id: "persistent-vomiting-el",
    message: "Γάτα που κάνει συνεχείς εμετούς",
    species: "cat",
    expectedHardStop: true,
    expectedCode: "persistent_vomiting",
  },
  {
    id: "not-eating-el",
    message: "Γάτα που δεν τρώει για 48 ώρες",
    species: "cat",
    expectedHardStop: true,
    expectedCode: "not_eating",
  },
  {
    id: "collapse-en",
    message: "My dog collapsed and has severe abdominal pain",
    species: "dog",
    expectedHardStop: true,
    expectedCode: "collapse_or_severe_pain",
  },
  {
    id: "renal-caution-not-hard-stop",
    message: "Γάτα με νεφρική ανεπάρκεια IRIS 2",
    species: "cat",
    expectedHardStop: false,
    expectedCode: "renal",
  },
  {
    id: "normal-sterilised-cat",
    message: "Στειρωμένη γάτα 2 ετών, 4kg, indoor, λατρεύει κοτόπουλο",
    species: "cat",
    expectedHardStop: false,
  },
];

function codes(warnings: ChatbotSafetyWarning[]) {
  return warnings.map((warning) => warning.code);
}

const failures: string[] = [];

for (const safetyCase of cases) {
  const warnings = detectSafetyWarnings({
    message: safetyCase.message,
    pet: { species: safetyCase.species },
    locale: "el",
  });
  const hardStop = hasHardStop(warnings);
  const warningCodes = codes(warnings);

  if (hardStop !== safetyCase.expectedHardStop) {
    failures.push(
      `${safetyCase.id}: expected hardStop=${safetyCase.expectedHardStop}, got ${hardStop}; codes=${warningCodes.join(", ")}`
    );
  }

  if (safetyCase.expectedCode && !warningCodes.includes(safetyCase.expectedCode)) {
    failures.push(
      `${safetyCase.id}: expected code ${safetyCase.expectedCode}; codes=${warningCodes.join(", ")}`
    );
  }
}

if (failures.length > 0) {
  console.error("Chatbot safety interrupt QA failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Chatbot safety interrupt QA passed (${cases.length}/${cases.length}).`);
