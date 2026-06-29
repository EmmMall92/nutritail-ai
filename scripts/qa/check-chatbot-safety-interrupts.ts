import {
  detectSafetyWarnings,
  hasHardStop,
  shouldInterruptForSafety,
  type ChatbotSafetyWarning,
} from "../../lib/chatbot/safetyRules";

type SafetyCase = {
  id: string;
  message: string;
  species?: "dog" | "cat";
  expectedHardStop: boolean;
  expectedInterrupt: boolean;
  expectedCode?: string;
};

const cases: SafetyCase[] = [
  {
    id: "male-cat-no-urine-el",
    message: "Αρσενικός γάτος που προσπαθεί να ουρήσει και δεν μπορεί",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "manual-qa-greek-male-cat-straining",
    message: "Ο γάτος μου προσπαθεί να κατουρήσει και δεν μπορεί. Τι τροφή να πάρω;",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "live-greek-cat-straining-without-species-context",
    message: "Ο γάτος μου προσπαθεί να κατουρήσει και δεν μπορεί. Τι τροφή να πάρω;",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "live-greek-male-cat-not-peeing-colloquial",
    message: "Έχω αρσενική γάτα που πάει στην άμμο αλλά δεν κατουράει και κλαίει",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "greeklish-male-cat-no-urine",
    message: "o gatos mou prospathiei na katourisei kai den mporei. ti trofi na paro?",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "male_cat_no_urine",
  },
  {
    id: "blood-urine-el",
    message: "Γάτα με αίμα στα ούρα",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "blood_seen",
  },
  {
    id: "greeklish-blood-urine",
    message: "gata me aima sta oura",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "blood_seen",
  },
  {
    id: "manual-qa-dog-blood-diarrhea",
    message: "Ο σκύλος μου έχει διάρροια με αίμα. Να αλλάξω τροφή;",
    species: "dog",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "blood_seen",
  },
  {
    id: "persistent-vomiting-el",
    message: "Γάτα που κάνει συνεχείς εμετούς",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "persistent_vomiting",
  },
  {
    id: "greeklish-persistent-vomiting",
    message: "gata pou kanei synecheis emetous",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "persistent_vomiting",
  },
  {
    id: "not-eating-el",
    message: "Γάτα που δεν τρώει για 48 ώρες",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "not_eating",
  },
  {
    id: "greeklish-cat-not-eating-48h",
    message: "i gata mou den troei katholou edo kai 48 ores",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "not_eating",
  },
  {
    id: "manual-qa-cat-not-eating-48h",
    message: "Η γάτα μου δεν τρώει εδώ και δύο μέρες. Ποια τροφή να της δώσω;",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "not_eating",
  },
  {
    id: "collapse-en",
    message: "My dog collapsed and has severe abdominal pain",
    species: "dog",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "collapse_or_severe_pain",
  },
  {
    id: "not-eating-at-all-en",
    message: "My cat is not eating at all",
    species: "cat",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "not_eating",
  },
  {
    id: "senior-low-appetite-not-hard-stop-en",
    message: "Senior dog with low appetite and not eating much",
    species: "dog",
    expectedHardStop: false,
    expectedInterrupt: false,
  },
  {
    id: "dog-low-water-intake-warning-el",
    message: "Έχω σκύλο 13kg, δεν πίνει πολύ νερό.",
    species: "dog",
    expectedHardStop: false,
    expectedInterrupt: true,
    expectedCode: "low_water_intake",
  },
  {
    id: "dog-not-drinking-hard-stop-el",
    message: "Ο σκύλος μου δεν πίνει καθόλου νερό.",
    species: "dog",
    expectedHardStop: true,
    expectedInterrupt: true,
    expectedCode: "not_drinking",
  },
  {
    id: "dog-not-drinking-much-warning-en",
    message: "My dog is not drinking much water.",
    species: "dog",
    expectedHardStop: false,
    expectedInterrupt: true,
    expectedCode: "low_water_intake",
  },
  {
    id: "renal-caution-interrupts-normal-flow",
    message: "Γάτα με νεφρική νόσο IRIS 3 και θέλω απλή senior τροφή",
    species: "cat",
    expectedHardStop: false,
    expectedInterrupt: true,
    expectedCode: "renal",
  },
  {
    id: "pancreatitis-caution-interrupts-normal-flow",
    message: "Ο σκύλος μου έχει παγκρεατίτιδα και θέλω τροφή με πολλά λιπαρά",
    species: "dog",
    expectedHardStop: false,
    expectedInterrupt: true,
    expectedCode: "pancreatitis",
  },
  {
    id: "diabetes-caution-interrupts-normal-flow",
    message: "Ο σκύλος μου έχει διαβήτη και θέλω να αλλάξω τροφή",
    species: "dog",
    expectedHardStop: false,
    expectedInterrupt: true,
    expectedCode: "diabetes",
  },
  {
    id: "normal-sterilised-cat",
    message: "Στειρωμένη γάτα 2 ετών, 4kg, indoor, λατρεύει κοτόπουλο",
    species: "cat",
    expectedHardStop: false,
    expectedInterrupt: false,
  },
  {
    id: "male-cat-flutd-history-not-urgent",
    message: "Στειρωμένος γάτος 6kg με ιστορικό FLUTD",
    species: "cat",
    expectedHardStop: false,
    expectedInterrupt: false,
  },
  {
    id: "greedy-eating-not-blood",
    message: "Rescue γάτα που τρώει λαίμαργα",
    species: "cat",
    expectedHardStop: false,
    expectedInterrupt: false,
  },
  {
    id: "kitten-picky-eating-not-emergency",
    message: "Γατάκι 2 μηνών που δεν τρώει εύκολα",
    species: "cat",
    expectedHardStop: false,
    expectedInterrupt: false,
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
  const interrupt = shouldInterruptForSafety(warnings);
  const warningCodes = codes(warnings);

  if (hardStop !== safetyCase.expectedHardStop) {
    failures.push(
      `${safetyCase.id}: expected hardStop=${safetyCase.expectedHardStop}, got ${hardStop}; codes=${warningCodes.join(", ")}`
    );
  }

  if (interrupt !== safetyCase.expectedInterrupt) {
    failures.push(
      `${safetyCase.id}: expected interrupt=${safetyCase.expectedInterrupt}, got ${interrupt}; codes=${warningCodes.join(", ")}`
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
