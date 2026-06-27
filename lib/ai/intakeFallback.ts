import type {
  AiIntakeExtraction,
  ExtractedActivityLevel,
  ExtractedSpecies,
  ExtractedWeightGoal,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";

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

const PROTEIN_TERMS = [
  { keys: ["salmon", "σολομ"], value: "salmon" },
  { keys: ["chicken", "κοτοπ"], value: "chicken" },
  { keys: ["lamb", "αρν"], value: "lamb" },
  { keys: ["beef", "μοσχαρ", "βοδιν"], value: "beef" },
  { keys: ["fish", "ψαρ"], value: "fish" },
  { keys: ["duck", "παπια", "πάπια"], value: "duck" },
  { keys: ["pork", "χοιριν"], value: "pork" },
  { keys: ["turkey", "γαλοπουλ"], value: "turkey" },
  { keys: ["rabbit", "κουνελ"], value: "rabbit" },
  { keys: ["tuna", "τονο", "τόνο"], value: "tuna" },
  { keys: ["rice", "ρυζ"], value: "rice" },
  { keys: ["grain", "σιτηρ", "δημητριακ"], value: "grain" },
  { keys: ["wheat", "σιταρ"], value: "wheat" },
  { keys: ["corn", "maize", "καλαμποκ"], value: "corn" },
  { keys: ["dairy", "milk", "cheese", "γαλακτοκομ", "γαλα"], value: "dairy" },
  { keys: ["legume", "pea", "lentil", "οσπρ", "αρακα", "φακ"], value: "legumes" },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseWeightKg(text: string) {
  const normalized = normalizeText(text).replace(",", ".");
  const explicitWeightMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:kg|κιλ|kila|κιλα)(?:\s|$|[.,;!?)])/i
  );
  if (explicitWeightMatch) return Number(explicitWeightMatch[1]);

  const weightWordMatch = normalized.match(
    /(?:βαρος|βάρος|weight)\D{0,16}(\d+(?:\.\d+)?)/i
  );
  if (weightWordMatch) return Number(weightWordMatch[1]);

  const match = normalized.match(/(\d+(?:\.\d+)?)/i);
  if (!match) return null;

  if (Number(match[1]) > 40) return null;

  return Number(match[1]);
}

function parseAgeYears(text: string) {
  const normalized = normalizeText(text).replace(",", ".");
  const yearMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|ετων|χρον|etos|etwn)/i);
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    return years > 0 ? years : null;
  }

  const monthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:months?|μην|minon|mhn)/i);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    return months > 0 ? Number((months / 12).toFixed(2)) : null;
  }

  return null;
}

function detectSpecies(text: string): ExtractedSpecies | null {
  if (
    includesAny(text, [
      "dog",
      "puppy",
      "skyl",
      "skil",
      "σκυλ",
      "σκυλο",
      "σκύλο",
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
  ) return "dog";
  if (includesAny(text, ["cat", "kitten", "gat", "γατ", "γάτ", "γατακ", "γατακι", "γατάκι"])) return "cat";
  return null;
}

function detectActivity(text: string): ExtractedActivityLevel | null {
  if (includesAny(text, ["low", "χαμηλ", "lazy", "ηρεμ"])) return "low";
  if (includesAny(text, ["high", "υψηλ", "active", "τρεχει", "τρέχει", "πολυ", "πολύ"])) return "high";
  if (includesAny(text, ["normal", "medium", "κανονικ", "μετρι", "μέτρι"])) return "normal";
  return null;
}

function detectWeightGoal(text: string): ExtractedWeightGoal | null {
  if (includesAny(text, ["loss", "lose", "απωλ", "απώλ", "χασει", "χάσει", "αδυνατ"])) return "loss";
  if (includesAny(text, ["gain", "αυξη", "αύξη", "παρει", "πάρει", "βαλει", "βάλει"])) return "gain";
  if (includesAny(text, ["maintain", "maintenance", "διατηρ", "συντηρ", "κρατησει", "κρατήσει"])) return "maintain";
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
  return /[α-ωΑ-Ωάέήίόύώϊϋΐΰ]/.test(message) ? "el" : "en";
}

function detectPetName(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  const greekNameToken = "[A-Za-z\\u0370-\\u03ff\\u1f00-\\u1fff-]{2,30}";
  const safePatterns = [
    new RegExp(
      `(?:\\u03c4\\u03bf\\u03bd|\\u03c4\\u03b7\\u03bd|\\u03c4\\u03b7|\\u03c4\\u03bf)\\s+(?:\\u03bb\\u03b5\\u03bd\\u03b5|\\u03bb\\u03ad\\u03bd\\u03b5|\\u03bb\\u03b5\\u03b3\\u03b5\\u03c4\\u03b1\\u03b9|\\u03bb\\u03ad\\u03b3\\u03b5\\u03c4\\u03b1\\u03b9)\\s+(?:(?:\\u03c4\\u03bf\\u03bd|\\u03c4\\u03b7\\u03bd|\\u03c4\\u03b7|\\u03c4\\u03bf)\\s+)?(${greekNameToken})`,
      "iu"
    ),
    new RegExp(
      `(?:\\u03bf|\\u03b7)\\s+(?:\\u03c3\\u03ba\\u03c5\\u03bb\\u03bf\\u03c2|\\u03c3\\u03ba\\u03cd\\u03bb\\u03bf\\u03c2|\\u03b3\\u03b1\\u03c4\\u03b1|\\u03b3\\u03ac\\u03c4\\u03b1|\\u03b3\\u03b1\\u03c4\\u03bf\\u03c2|\\u03b3\\u03ac\\u03c4\\u03bf\\u03c2)\\s+\\u03bc\\u03bf\\u03c5\\s+(?:\\u03bb\\u03b5\\u03bd\\u03b5|\\u03bb\\u03ad\\u03bd\\u03b5|\\u03bb\\u03b5\\u03b3\\u03b5\\u03c4\\u03b1\\u03b9|\\u03bb\\u03ad\\u03b3\\u03b5\\u03c4\\u03b1\\u03b9)\\s+(${greekNameToken})`,
      "iu"
    ),
    /(?:my\s+)?(?:dog|cat|pet)\s+is\s+(?:called|named)\s+([A-Za-z-]{2,30})/i,
  ];

  for (const pattern of safePatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1];
  }

  const patterns = [
    /(?:τον|την|τη|το)\s+(?:λενε|λένε|λεγεται|λέγεται)\s+([A-Za-zΑ-Ωα-ωΆ-ώϊϋΐΰ-]{2,30})/i,
    /(?:ονομαζεται|ονομάζεται|name is|called|named)\s+([A-Za-zΑ-Ωα-ωΆ-ώϊϋΐΰ-]{2,30})/i,
    /(?:τον|την|τη|το)\s+([A-Za-zΑ-Ωα-ωΆ-ώϊϋΐΰ-]{2,30})\s+(?:λενε|λένε)/i,
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

function splitPreferenceClauses(text: string) {
  return text
    .replace(/\s+και\s+(?=δεν\s+)/g, ". ")
    .replace(/\s+and\s+(?=(does not|doesnt|dont|do not|no|not)\s+)/g, ". ")
    .split(/[.,;|\n]+|\s+αλλα\s+|\s+αλλά\s+|\s+but\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function detectProteinPreferences(text: string) {
  const excluded: string[] = [];
  const preferred: string[] = [];
  const clauses = splitPreferenceClauses(text);
  const avoidSignals = [
    "avoid",
    "exclude",
    "allerg",
    "does not like",
    "doesnt like",
    "dont like",
    "do not like",
    "not like",
    "δεν τρω",
    "δεν του αρε",
    "δεν της αρε",
    "δεν αρε",
    "δεν μπορει",
    "δεν μπορεί",
    "τον πειρα",
    "την πειρα",
    "αλλεργ",
  ];
  const preferSignals = ["like", "prefer", "favorite", "αρεσει", "αρέσει", "προτιμ", "τρωει", "τρώει"];

  for (const clause of clauses.length > 0 ? clauses : [text]) {
    const matches = PROTEIN_TERMS.filter((term) =>
      term.keys.some((key) => clause.includes(normalizeText(key)))
    ).map((term) => term.value);

    if (matches.length === 0) continue;

    if (includesAny(clause, avoidSignals)) {
      excluded.push(...matches);
    } else if (includesAny(clause, preferSignals)) {
      preferred.push(...matches);
    }
  }

  const uniqueExcluded = unique(excluded);
  const excludedSet = new Set(uniqueExcluded);

  return {
    excluded: uniqueExcluded,
    preferred: unique(preferred).filter((value) => !excludedSet.has(value)),
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
    [["δεν κατουρα", "δεν ουρει", "δεν μπορει να κατουρ", "δεν μπορει να ουρ", "προσπαθει να ουρ", "προσπαθει να κατουρ", "no urine", "straining"], "urinary_blockage_risk"],
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
  const proteinPreferences = detectProteinPreferences(text);

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
      [["sensitive", "gastro", "diarr", "ευαισθ", "διαρ", "μαλακα κακα", "μαλακά κακά", "στομαχ"], "sensitive_digestion"],
      [["urinary", "struvite", "ουρο"], "urinary"],
      [["renal", "kidney", "νεφρ"], "renal"],
      [["pancreatitis", "παγκρεατ"], "pancreatitis"],
      [["diabetes", "diabetic", "διαβητ"], "diabetes"],
      [["large breed", "giant breed", "large-breed puppy", "giant-breed puppy", "μεγαλόσωμ", "μεγαλοσωμ", "γιγαντόσωμ", "γιγαντοσωμ"], "large_breed_growth"],
    ]),
    allergies: detectTerms(text, [[["allerg", "αλλεργ"], "suspected_allergy"]]),
    preferredProteins: proteinPreferences.preferred,
    excludedIngredients: proteinPreferences.excluded,
    redFlags: detectRedFlags(text),
    confidence: "low",
    notes: ["fallback_extractor"],
  };

  return validateAiIntakeExtraction(extraction);
}
