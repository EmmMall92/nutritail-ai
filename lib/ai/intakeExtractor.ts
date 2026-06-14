import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import type {
  AiIntakeExtraction,
  ExtractedActivityLevel,
  ExtractedSpecies,
  ExtractedWeightGoal,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";

type ExtractIntakeOptions = {
  locale?: "el" | "en";
  timeoutMs?: number;
};

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

function parseNumber(text: string) {
  const match = text.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function detectSpecies(text: string): ExtractedSpecies | null {
  if (includesAny(text, ["dog", "skyl", "skil", "σκυλ"])) return "dog";
  if (includesAny(text, ["cat", "gat", "γατ"])) return "cat";
  return null;
}

function detectActivity(text: string): ExtractedActivityLevel | null {
  if (includesAny(text, ["low", "χαμηλ", "lazy", "ηρεμ"])) return "low";
  if (includesAny(text, ["high", "υψηλ", "active", "τρεχει", "τρέχει"])) return "high";
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
  if (includesAny(text, ["not neutered", "οχι στειρ", "όχι στειρ"])) return false;
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

function fallbackExtractIntake(message: string): ValidatedAiIntakeExtraction {
  const text = normalizeText(message);
  const number = parseNumber(message);

  const extraction: AiIntakeExtraction = {
    ...EMPTY_EXTRACTION,
    species: detectSpecies(text),
    weightKg: includesAny(text, ["kg", "κιλ"]) ? number : null,
    ageYears: includesAny(text, ["year", "ετων", "χρον"]) ? number : null,
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

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as AiIntakeExtraction;
  } catch {
    return null;
  }
}

export async function extractPetIntakeFacts(
  message: string,
  options: ExtractIntakeOptions = {}
): Promise<ValidatedAiIntakeExtraction & { source: "openai" | "fallback" }> {
  const fallback = fallbackExtractIntake(message);

  if (!isOpenAiConfigured()) {
    return { ...fallback, source: "fallback" };
  }

  const client = getOpenAiClient();
  if (!client) return { ...fallback, source: "fallback" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const response = await client.responses.create(
      {
        model: getOpenAiModel(),
        input: [
          {
            role: "system",
            content:
              "Extract only pet nutrition intake facts from the user message. Return strict JSON only. Do not recommend foods, diagnose, or invent facts. Use null for unknown values. Allowed enums: species dog|cat, activityLevel low|normal|high, weightGoal maintain|loss|gain, language el|en, confidence high|medium|low.",
          },
          {
            role: "user",
            content: `Message:\n${message}\n\nReturn JSON with keys: species, petName, weightKg, ageYears, activityLevel, neutered, healthIssues, allergies, currentFoodName, preferredProteins, excludedIngredients, weightGoal, language, missingFields, redFlags, confidence, notes.`,
          },
        ],
        temperature: 0,
        max_output_tokens: 700,
      },
      { signal: controller.signal }
    );

    const parsed = extractJsonObject(response.output_text ?? "");
    if (!parsed) return { ...fallback, source: "fallback" };

    const validated = validateAiIntakeExtraction(parsed);
    return {
      ...validated,
      source: validated.canUse ? "openai" : "fallback",
    };
  } catch {
    return { ...fallback, source: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}

export { fallbackExtractIntake };
