import type {
  AiIntakeExtraction,
  ExtractedActivityLevel,
  ExtractedSpecies,
  ExtractedWeightGoal,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import { parseTastePreferences } from "@/lib/chatbot/tastePreferences";

const EMPTY_EXTRACTION: AiIntakeExtraction = {
  healthIssues: [],
  allergies: [],
  preferredProteins: [],
  excludedIngredients: [],
  missingFields: [],
  redFlags: [],
  confidence: "low",
  notes: [],
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseWeightKg(message: string) {
  const normalized = normalizeText(message).replace(",", ".");
  const explicitWeightMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:kg|kgs|κιλ\p{L}*|kila|kilos?)(?:\s|$|[.,;!?)])/iu
  );
  if (explicitWeightMatch) return Number(explicitWeightMatch[1]);

  const weightWordMatch = normalized.match(
    /(?:βαρος|weight)\D{0,16}(\d+(?:\.\d+)?)/i
  );
  if (weightWordMatch) return Number(weightWordMatch[1]);

  const match = normalized.match(/(\d+(?:\.\d+)?)/i);
  if (!match) return null;

  const firstNumber = Number(match[1]);
  return firstNumber > 40 ? null : firstNumber;
}

function parseAgeYears(message: string) {
  const normalized = normalizeText(message).replace(",", ".");
  const yearMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?|ετων|χρον|etos|etwn)/i
  );
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    return years > 0 ? years : null;
  }

  const monthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:months?|μην|minon|mhn)/i);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    return months > 0 ? Number((months / 12).toFixed(2)) : null;
  }

  if (
    includesAny(normalized, [
      "puppy",
      "kitten",
      "\u03ba\u03bf\u03c5\u03c4\u03b1\u03b2",
      "\u03b3\u03b1\u03c4\u03b1\u03ba",
    ])
  ) {
    return 0.4;
  }

  return null;
}

function detectSpecies(text: string): ExtractedSpecies | null {
  if (includesAny(text, ["σκυλ", "κουταβ"])) return "dog";
  if (includesAny(text, ["γατ", "γατακ"])) return "cat";

  if (
    includesAny(text, [
      "dog",
      "puppy",
      "skyl",
      "skil",
      "σκυλ",
      "κουταβ",
      "akita",
      "boxer",
      "rottweiler",
      "cane corso",
      "great dane",
      "saint bernard",
      "doberman",
      "malinois",
      "husky",
      "yorkshire",
      "maltese",
      "labrador",
      "golden retriever",
      "german shepherd",
    ])
  ) {
    return "dog";
  }

  if (includesAny(text, ["cat", "kitten", "gat", "γατ", "γατακ"])) return "cat";
  return null;
}

function detectActivity(text: string): ExtractedActivityLevel | null {
  if (includesAny(text, ["low", "indoor", "apartment", "χαμηλ", "lazy", "ηρεμ"])) return "low";
  if (includesAny(text, ["high", "υψηλ", "active", "τρεχει", "τρεχ", "πολυ", "πολύ"])) {
    return "high";
  }
  if (includesAny(text, ["normal", "medium", "κανονικ", "μετρι", "μέτρι"])) {
    return "normal";
  }
  return null;
}

function detectWeightGoal(text: string): ExtractedWeightGoal | null {
  if (includesAny(text, ["loss", "lose", "απωλ", "απώλ", "χασει", "χάσει", "αδυνατ"])) {
    return "loss";
  }
  if (includesAny(text, ["gain", "αυξη", "αύξη", "παρει", "πάρει", "βαλει", "βάλει"])) {
    return "gain";
  }
  if (includesAny(text, ["maintain", "maintenance", "διατηρ", "συντηρ", "κρατησει", "κρατήσει"])) {
    return "maintain";
  }
  return null;
}

function detectNeutered(text: string) {
  if (
    includesAny(text, [
      "not neutered",
      "not sterilised",
      "not sterilized",
      "οχι στειρ",
      "όχι στειρ",
      "δεν ειναι στειρ",
      "δεν είναι στειρ",
    ])
  ) {
    return false;
  }

  if (includesAny(text, ["neutered", "sterilised", "sterilized", "στειρ"])) return true;
  return null;
}

function detectLanguage(message: string) {
  if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(message)) return "el";

  const text = normalizeText(message);
  if (
    includesAny(text, [
      "skyl",
      "skil",
      "gat",
      "kou",
      "trofi",
      "fagito",
      "kaka",
      "aera",
      "aeria",
      "stomaxi",
      "stomachi",
      "peirazei",
      "aresei",
      "troei",
    ])
  ) {
    return "el";
  }

  return "en";
}

function detectPetName(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  const greekNameToken = "[A-Za-z\\u0370-\\u03ff\\u1f00-\\u1fff-]{2,30}";
  const patterns = [
    new RegExp(
      `(?:τον|την|τη|το)\\s+(?:λενε|λένε|λεγεται|λέγεται)\\s+(?:(?:τον|την|τη|το)\\s+)?(${greekNameToken})`,
      "iu"
    ),
    new RegExp(
      `(?:ο|η)\\s+(?:σκυλος|σκύλος|γατα|γάτα|γατος|γάτος)\\s+μου\\s+(?:λενε|λένε|λεγεται|λέγεται)\\s+(${greekNameToken})`,
      "iu"
    ),
    /(?:my\s+)?(?:dog|cat|pet)\s+is\s+(?:called|named)\s+([A-Za-z-]{2,30})/i,
    /(?:name is|called|named)\s+([A-Za-z-]{2,30})/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function detectTerms(text: string, aliases: Array<[string[], string]>) {
  return unique(
    aliases
      .filter(([terms]) => includesAny(text, terms))
      .map(([, canonical]) => canonical)
  );
}

function mergeUniqueValues(...arrays: Array<string[] | undefined>) {
  return [...new Set(arrays.flatMap((items) => items ?? []).filter(Boolean))];
}

function textHasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function detectContextualActivity(text: string): ExtractedActivityLevel | null {
  if (
    textHasAny(text, [
      "ζει αποκλειστικα εξω",
      "ζει εξω",
      "αγροκτημα",
      "κτημα",
      "δουλευει σε βουνο",
      "κυνηγαει",
      "agility",
      "κολυμπαει καθημερινα",
      "τρεχει μαζι μου",
      "farm",
      "outside",
      "outdoor",
      "working",
    ])
  ) {
    return "high";
  }

  if (
    textHasAny(text, [
      "διαμερισμα",
      "πολυκατοικια",
      "χωρις αυλη",
      "αποκλειστικα σε διαμερισμα",
      "κοιμαται 20 ωρες",
      "apartment",
      "no yard",
    ])
  ) {
    return "low";
  }

  return null;
}

function detectContextualWeightGoal(text: string): ExtractedWeightGoal | null {
  if (
    textHasAny(text, [
      "χανει βαρος χωρις λογο",
      "εχει χασει πολλα κιλα",
      "χασει πολλα κιλα",
      "χανει μυς",
      "χανει μυικη μαζα",
      "χαμηλη μυικη μαζα",
      "χρειαζεται να παρει μυικη μαζα",
      "πολυ αδυνατο",
      "υποσιτισ",
      "losing weight for no reason",
      "lost a lot of weight",
      "low muscle",
    ])
  ) {
    return "gain";
  }

  return null;
}

function detectContextualHealthIssues(text: string) {
  return detectTerms(text, [
    [
      [
        "χανει βαρος χωρις λογο",
        "εχει χασει πολλα κιλα",
        "χασει πολλα κιλα",
        "πολυ αδυνατο",
        "υποσιτισ",
        "losing weight",
        "underweight",
      ],
      "unexplained_weight_loss",
    ],
    [["χανει μυς", "μυικη μαζα", "low muscle", "muscle mass"], "low_muscle_mass"],
    [["εγκυο", "εγκυος", "pregnant"], "pregnancy"],
    [["θηλαζει", "θηλασ", "lactating", "nursing"], "lactation"],
    [["ορφανο", "orphan"], "orphan_puppy"],
    [["τρωει χορτα", "eats grass"], "eats_grass"],
    [["δαγκωνει την ουρα", "bites tail"], "tail_biting"],
    [["αλλεργ", "allerg"], "allergy"],
    [["πειραζ", "bothers", "does not tolerate"], "food_sensitivity"],
    [["μαγειρευτο", "μαγειρευτη", "cooked food", "home cooked"], "mixed_home_cooked_food"],
    [["πινει πολυ νερο", "πολυ νερο", "πολυ διψ", "drinks a lot", "excessive thirst"], "increased_thirst"],
    [["rescue", "αγνωστο ιστορικο"], "unknown_history"],
    [["πολλα συστατικα", "multiple ingredients"], "multiple_food_triggers"],
    [["δεν μυριζει καλα το φαγητο", "poor smell"], "low_food_smell_interest"],
    [["κοιμαται 20 ωρες", "sleeps 20 hours"], "lethargy_or_low_activity"],
    [["πνιγεται", "μεγαλες κροκετες", "choking", "large kibble"], "chewing_or_choking_risk"],
  ]);
}

function detectContextualExcludedIngredients(text: string) {
  if (
    !textHasAny(text, [
      "δεν αντεχ",
      "δεν τρω",
      "χωρις",
      "πειραζ",
      "αλλεργ",
      "avoid",
      "without",
      "allerg",
    ])
  ) {
    return [];
  }

  return detectTerms(text, [
    [["σιταρ", "wheat"], "wheat"],
    [["καλαμποκ", "corn", "maize"], "corn"],
    [["γαλακτοκομ", "γαλακτ", "γαλα", "τυρ", "dairy", "milk", "cheese"], "dairy"],
    [["οσπρ", "αρακα", "φακ", "legume", "pea", "lentil"], "legumes"],
  ]);
}

function applyMessageDerivedGuards(
  message: string,
  extraction: AiIntakeExtraction
): AiIntakeExtraction {
  const text = normalizeText(message);
  const guardedPreferences = parseTastePreferences(text);
  const contextualActivity = detectContextualActivity(text);
  const contextualWeightGoal = detectContextualWeightGoal(text);
  const contextualHealthIssues = detectContextualHealthIssues(text);
  const contextualExcludedIngredients = detectContextualExcludedIngredients(text);

  return {
    ...extraction,
    activityLevel: contextualActivity ?? extraction.activityLevel ?? null,
    weightGoal: contextualWeightGoal ?? extraction.weightGoal ?? null,
    healthIssues: mergeUniqueValues(extraction.healthIssues, contextualHealthIssues),
    preferredProteins: mergeUniqueValues(
      extraction.preferredProteins,
      guardedPreferences.preferredProteins
    ),
    excludedIngredients: mergeUniqueValues(
      extraction.excludedIngredients,
      guardedPreferences.excludedIngredients,
      contextualExcludedIngredients
    ),
  };
}

function detectCurrentFood(message: string) {
  const normalized = normalizeText(message);
  if (includesAny(normalized, ["δεν ξερω", "δεν ξέρω", "dont know", "don't know", "not sure"])) {
    return null;
  }

  if (
    includesAny(normalized, [
      "δεν τρω",
      "δεν του αρε",
      "δεν της αρε",
      "δεν αρε",
      "τον πειρα",
      "την πειρα",
      "αλλεργ",
      "avoid",
      "does not like",
      "doesnt like",
      "does not eat",
      "dont eat",
      "allerg",
    ])
  ) {
    return null;
  }

  const match = message.match(/(?:τρωει|τρώει|current food|now eating)\s+(.{3,80})/i);
  return match?.[1]?.trim() ?? null;
}

function detectRedFlags(text: string) {
  return detectTerms(text, [
    [
      [
        "δεν κατουρα",
        "δεν ουρει",
        "δεν μπορει να κατουρ",
        "δεν μπορει να ουρ",
        "προσπαθει να ουρ",
        "προσπαθει να κατουρ",
        "no urine",
        "straining",
      ],
      "urinary_blockage_risk",
    ],
    [["αιμα", "αίμα", "blood"], "blood"],
    [["δεν τρωει καθολου", "δεν τρωει για", "δεν εχει ορεξ", "ανορεξ", "not eating"], "not_eating"],
    [["συνεχεις εμετ", "συνεχ", "εμετ", "vomit"], "vomiting"],
    [["καταρρε", "collapse"], "collapse"],
    [["παγκρεατ", "pancreatitis"], "pancreatitis"],
    [["νεφρ", "ουρια", "κρεατιν", "renal", "kidney", "ckd"], "renal"],
    [["διαβητ", "diabetes"], "diabetes"],
  ]);
}

export function fallbackExtractIntake(
  message: string
): ValidatedAiIntakeExtraction {
  const text = normalizeText(message);
  const proteinPreferences = parseTastePreferences(text);

  const extraction: AiIntakeExtraction = {
    ...EMPTY_EXTRACTION,
    species: detectSpecies(text),
    petName: detectPetName(message),
    weightKg: parseWeightKg(message),
    ageYears: parseAgeYears(message),
    activityLevel: detectActivity(text),
    neutered: detectNeutered(text),
    weightGoal: detectWeightGoal(text),
    language: detectLanguage(message),
    currentFoodName: detectCurrentFood(message),
    healthIssues: detectTerms(text, [
      [["itch", "skin", "φαγουρ", "δερμα", "δέρμα"], "itchy_skin"],
      [
        [
          "sensitive",
          "gastro",
          "diarr",
          "ευαισθ",
          "διαρ",
          "μαλακα κακα",
          "μαλακά κακά",
          "malaka kaka",
          "aera",
          "aeria",
          "στομαχ",
          "stomaxi",
          "stomachi",
        ],
        "sensitive_digestion",
      ],
      [["urinary", "struvite", "ουρο"], "urinary"],
      [["renal", "kidney", "νεφρ"], "renal"],
      [["pancreatitis", "παγκρεατ"], "pancreatitis"],
      [["diabetes", "diabetic", "διαβητ"], "diabetes"],
      [
        [
          "large breed",
          "giant breed",
          "large-breed puppy",
          "giant-breed puppy",
          "μεγαλοσωμ",
          "μεγαλόσωμ",
          "γιγαντοσωμ",
          "γιγαντόσωμ",
        ],
        "large_breed_growth",
      ],
    ]),
    allergies: detectTerms(text, [[["allerg", "αλλεργ"], "suspected_allergy"]]),
    preferredProteins: proteinPreferences.preferredProteins,
    excludedIngredients: proteinPreferences.excludedIngredients,
    redFlags: detectRedFlags(text),
    confidence: "low",
    notes: ["fallback_extractor"],
  };

  return validateAiIntakeExtraction(applyMessageDerivedGuards(message, extraction));
}

export function applyIntakeMessageGuards(
  message: string,
  extraction: AiIntakeExtraction
) {
  return applyMessageDerivedGuards(message, extraction);
}
