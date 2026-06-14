import type {
  AiIntakeExtraction,
  ExtractedActivityLevel,
  ExtractedSpecies,
  ExtractedWeightGoal,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";

const VALID_SPECIES = new Set<ExtractedSpecies>(["dog", "cat"]);
const VALID_ACTIVITY = new Set<ExtractedActivityLevel>(["low", "normal", "high"]);
const VALID_WEIGHT_GOALS = new Set<ExtractedWeightGoal>([
  "maintain",
  "loss",
  "gain",
]);

const DOG_MAX_WEIGHT_KG = 90;
const CAT_MAX_WEIGHT_KG = 15;
const MAX_AGE_YEARS = 40;

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: string[] = [];

  for (const item of value) {
    const cleaned = cleanString(item);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    items.push(cleaned);
  }

  return items.slice(0, 12);
}

function cleanNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function validateWeight({
  species,
  weightKg,
  warnings,
  errors,
}: {
  species?: ExtractedSpecies | null;
  weightKg?: number | null;
  warnings: string[];
  errors: string[];
}) {
  if (weightKg === null || weightKg === undefined) return null;

  if (weightKg <= 0) {
    errors.push("Weight must be greater than 0kg.");
    return null;
  }

  const max = species === "cat" ? CAT_MAX_WEIGHT_KG : DOG_MAX_WEIGHT_KG;

  if (weightKg > max) {
    errors.push(
      species === "cat"
        ? `Cat weight looks too high (${weightKg}kg).`
        : `Dog weight looks too high (${weightKg}kg).`
    );
    return null;
  }

  if (!species && weightKg > CAT_MAX_WEIGHT_KG) {
    warnings.push("Weight suggests dog-sized pet, but species is missing.");
  }

  return Number(weightKg.toFixed(2));
}

export function validateAiIntakeExtraction(
  input: AiIntakeExtraction
): ValidatedAiIntakeExtraction {
  const warnings: string[] = [];
  const errors: string[] = [];
  const acceptedFields: string[] = [];

  const species =
    input.species && VALID_SPECIES.has(input.species) ? input.species : null;

  if (input.species && !species) {
    warnings.push(`Ignored unsupported species: ${String(input.species)}.`);
  }

  const activityLevel =
    input.activityLevel && VALID_ACTIVITY.has(input.activityLevel)
      ? input.activityLevel
      : null;

  const weightGoal =
    input.weightGoal && VALID_WEIGHT_GOALS.has(input.weightGoal)
      ? input.weightGoal
      : null;

  const ageYears = cleanNumber(input.ageYears);
  const cleanAge =
    ageYears !== null && ageYears > 0 && ageYears <= MAX_AGE_YEARS
      ? Number(ageYears.toFixed(2))
      : null;

  if (ageYears !== null && cleanAge === null) {
    errors.push(`Age looks invalid (${ageYears}).`);
  }

  const cleanWeight = validateWeight({
    species,
    weightKg: cleanNumber(input.weightKg),
    warnings,
    errors,
  });

  const data: AiIntakeExtraction = {
    species,
    petName: cleanString(input.petName),
    weightKg: cleanWeight,
    ageYears: cleanAge,
    activityLevel,
    neutered:
      typeof input.neutered === "boolean" ? input.neutered : null,
    healthIssues: cleanStringArray(input.healthIssues),
    allergies: cleanStringArray(input.allergies),
    currentFoodName: cleanString(input.currentFoodName),
    preferredProteins: cleanStringArray(input.preferredProteins),
    excludedIngredients: cleanStringArray(input.excludedIngredients),
    weightGoal,
    language: input.language === "en" ? "en" : input.language === "el" ? "el" : null,
    missingFields: cleanStringArray(input.missingFields),
    redFlags: cleanStringArray(input.redFlags),
    confidence: input.confidence ?? "low",
    notes: cleanStringArray(input.notes),
  };

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) acceptedFields.push(key);
    else if (value !== null && value !== undefined) acceptedFields.push(key);
  }

  const missingFields = [
    "species",
    "weightKg",
    "ageYears",
    "activityLevel",
    "neutered",
    "weightGoal",
  ].filter((field) => !acceptedFields.includes(field));

  return {
    data,
    acceptedFields,
    missingFields: [...new Set([...missingFields, ...(data.missingFields ?? [])])],
    warnings,
    errors,
    canUse: errors.length === 0 && acceptedFields.length > 0,
  };
}
