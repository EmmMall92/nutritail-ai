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
  { keys: ["duck", "παπια"], value: "duck" },
  { keys: ["pork", "χοιριν"], value: "pork" },
  { keys: ["turkey", "γαλοπουλ"], value: "turkey" },
  { keys: ["rabbit", "κουνελ"], value: "rabbit" },
  { keys: ["tuna", "τονο"], value: "tuna" },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseWeightKg(text: string) {
  const match = text
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*(?:kg|κιλ)/i);
  return match ? Number(match[1]) : null;
}

function parseAgeYears(text: string) {
  const match = text
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|ετων|ετών|χρον)/i);
  return match ? Number(match[1]) : null;
}

function detectSpecies(text: string): ExtractedSpecies | null {
  if (includesAny(text, ["dog", "skyl", "skil", "σκυλ"])) return "dog";
  if (includesAny(text, ["cat", "gat", "γατ"])) return "cat";
  return null;
}

function detectActivity(text: string): ExtractedActivityLevel | null {
  if (includesAny(text, ["low", "χαμηλ", "lazy", "ηρεμ"])) return "low";
  if (includesAny(text, ["high", "υψηλ", "active", "τρεχει", "τρέχει", "πολυ"])) return "high";
  if (includesAny(text, ["normal", "medium", "κανονικ", "μεσα"])) return "normal";
  return null;
}

function detectWeightGoal(text: string): ExtractedWeightGoal | null {
  if (includesAny(text, ["loss", "lose", "απωλ", "χασει", "χάσει", "αδυνατ"])) return "loss";
  if (includesAny(text, ["gain", "αυξη", "αύξη", "παρει", "πάρει"])) return "gain";
  if (includesAny(text, ["maintain", "maintenance", "διατηρ", "συντηρ"])) return "maintain";
  return null;
}

function detectNeutered(text: string) {
  if (includesAny(text, ["not neutered", "οχι στειρ", "όχι στειρ", "δεν ειναι στειρ", "δεν είναι στειρ"])) return false;
  if (includesAny(text, ["neutered", "sterilised", "sterilized", "στειρ"])) return true;
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
    .replace(/\s+and\s+(?=(does not|doesn't|dont|don't|no|not)\s+)/g, ". ")
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
    "doesn't like",
    "dont like",
    "don't like",
    "not like",
    "δεν τρω",
    "δεν του αρε",
    "δεν της αρε",
    "δεν αρε",
    "τον πειρα",
    "την πειρα",
    "αλλεργ",
  ];
  const preferSignals = ["like", "prefer", "favorite", "αρεσει", "προτιμ", "τρωει"];

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

export function fallbackExtractIntake(
  message: string
): ValidatedAiIntakeExtraction {
  const text = normalizeText(message);
  const weightKg = parseWeightKg(message);
  const ageYears = parseAgeYears(message);
  const proteinPreferences = detectProteinPreferences(text);

  const extraction: AiIntakeExtraction = {
    ...EMPTY_EXTRACTION,
    species: detectSpecies(text),
    weightKg,
    ageYears,
    activityLevel: detectActivity(text),
    neutered: detectNeutered(text),
    weightGoal: detectWeightGoal(text),
    language: /[α-ωΑ-Ω]/.test(message) ? "el" : "en",
    healthIssues: detectTerms(text, [
      [["itch", "skin", "φαγουρ", "δερμ"], "itchy_skin"],
      [["sensitive", "gastro", "diarr", "ευαισθ", "διαρ"], "sensitive_digestion"],
      [["urinary", "struvite", "ουρο"], "urinary"],
      [["renal", "kidney", "νεφρ"], "renal"],
    ]),
    allergies: detectTerms(text, [[["allerg", "αλλεργ"], "suspected_allergy"]]),
    preferredProteins: proteinPreferences.preferred,
    excludedIngredients: proteinPreferences.excluded,
    confidence: "low",
    notes: ["fallback_extractor"],
  };

  return validateAiIntakeExtraction(extraction);
}
