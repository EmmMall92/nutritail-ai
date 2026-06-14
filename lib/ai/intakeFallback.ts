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
    .match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|ετων|χρον)/i);
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

export function fallbackExtractIntake(
  message: string
): ValidatedAiIntakeExtraction {
  const text = normalizeText(message);
  const weightKg = parseWeightKg(message);
  const ageYears = parseAgeYears(message);

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
    preferredProteins: detectTerms(text, [
      [["salmon", "σολομ"], "salmon"],
      [["chicken", "κοτοπ"], "chicken"],
      [["lamb", "αρν"], "lamb"],
      [["fish", "ψαρ"], "fish"],
    ]),
    excludedIngredients: includesAny(text, ["δεν τρω", "avoid", "exclude", "δεν του αρε"])
      ? detectTerms(text, [
          [["chicken", "κοτοπ"], "chicken"],
          [["lamb", "αρν"], "lamb"],
          [["beef", "μοσχαρ"], "beef"],
          [["fish", "ψαρ"], "fish"],
        ])
      : [],
    confidence: "low",
    notes: ["fallback_extractor"],
  };

  return validateAiIntakeExtraction(extraction);
}
