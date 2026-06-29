import { buildNutriTailSystemPrompt } from "@/lib/ai/promptInstructions";

export const NUTRITAIL_INTAKE_ALLOWED_ENUMS =
  "Allowed enums: species dog|cat, activityLevel low|normal|high, weightGoal maintain|loss|gain, language el|en, confidence high|medium|low.";

export const NUTRITAIL_INTAKE_JSON_KEYS = [
  "species",
  "petName",
  "weightKg",
  "ageYears",
  "activityLevel",
  "neutered",
  "healthIssues",
  "allergies",
  "currentFoodName",
  "preferredProteins",
  "excludedIngredients",
  "weightGoal",
  "language",
  "missingFields",
  "redFlags",
  "confidence",
  "notes",
] as const;

export function buildIntakeExtractionSystemPrompt() {
  return [
    buildNutriTailSystemPrompt("fact_extraction"),
    "",
    NUTRITAIL_INTAKE_ALLOWED_ENUMS,
  ].join("\n");
}

export function buildIntakeExtractionUserPrompt(message: string) {
  return [
    "Message:",
    message,
    "",
    `Return JSON with keys: ${NUTRITAIL_INTAKE_JSON_KEYS.join(", ")}.`,
  ].join("\n");
}

export function extractJsonObjectFromOpenAiText(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}
