import type {
  AiIntakeExtraction,
  ExtractedActivityLevel,
  ExtractedSpecies,
  ExtractedWeightGoal,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { removeExcludedFromPreferred } from "@/lib/chatbot/tastePreferences";
import { formatPetDisplayName } from "@/lib/petName";

const VALID_SPECIES = new Set<ExtractedSpecies>(["dog", "cat"]);
const VALID_ACTIVITY = new Set<ExtractedActivityLevel>(["low", "normal", "high"]);
const VALID_WEIGHT_GOALS = new Set<ExtractedWeightGoal>([
  "maintain",
  "loss",
  "gain",
]);

const RED_FLAG_ALIASES = [
  {
    canonical: "urinary_blockage",
    aliases: [
      "urinary_blockage",
      "urinary_blockage_risk",
      "difficulty urinating",
      "straining",
      "straining to urinate",
      "unable to urinate",
      "no urine",
      "cannot pee",
      "can't pee",
      "blocked",
      "\u03b4\u03b5\u03bd \u03ba\u03b1\u03c4\u03bf\u03c5\u03c1",
      "\u03b4\u03b5\u03bd \u03bf\u03c5\u03c1",
      "\u03b4\u03c5\u03c3\u03ba\u03bf\u03bb\u03b9\u03b1 \u03bf\u03c5\u03c1",
      "\u03c0\u03c1\u03bf\u03c3\u03c0\u03b1\u03b8\u03b5\u03b9 \u03bd\u03b1 \u03ba\u03b1\u03c4\u03bf\u03c5\u03c1",
      "\u03c0\u03c1\u03bf\u03c3\u03c0\u03b1\u03b8\u03b5\u03b9 \u03bd\u03b1 \u03bf\u03c5\u03c1",
    ],
  },
] as const;

const DOG_MAX_WEIGHT_KG = 90;
const CAT_MAX_WEIGHT_KG = 15;
const MAX_AGE_YEARS = 40;

const INGREDIENT_ALIASES = [
  { canonical: "chicken", aliases: ["chicken", "\u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb"] },
  { canonical: "lamb", aliases: ["lamb", "\u03b1\u03c1\u03bd"] },
  { canonical: "salmon", aliases: ["salmon", "\u03c3\u03bf\u03bb\u03bf\u03bc"] },
  { canonical: "fish", aliases: ["fish", "\u03c8\u03b1\u03c1"] },
  { canonical: "duck", aliases: ["duck", "\u03c0\u03b1\u03c0\u03b9\u03b1"] },
  { canonical: "beef", aliases: ["beef", "\u03bc\u03bf\u03c3\u03c7\u03b1\u03c1", "\u03b2\u03bf\u03b4\u03b9\u03bd"] },
  { canonical: "pork", aliases: ["pork", "\u03c7\u03bf\u03b9\u03c1\u03b9\u03bd"] },
  { canonical: "turkey", aliases: ["turkey", "\u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03c5\u03bb"] },
  { canonical: "rabbit", aliases: ["rabbit", "\u03ba\u03bf\u03c5\u03bd\u03b5\u03bb"] },
  { canonical: "tuna", aliases: ["tuna", "\u03c4\u03bf\u03bd\u03bf"] },
  { canonical: "rice", aliases: ["rice", "\u03c1\u03c5\u03b6"] },
  { canonical: "grain", aliases: ["grain", "\u03c3\u03b9\u03c4\u03b7\u03c1", "\u03b4\u03b7\u03bc\u03b7\u03c4\u03c1\u03b9\u03b1\u03ba"] },
] as const;

function normalizeLookup(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanPetName(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  return formatPetDisplayName(cleaned);
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

function canonicalizeRedFlagTerm(value: string) {
  const normalized = normalizeLookup(value);

  for (const item of RED_FLAG_ALIASES) {
    if (item.aliases.some((alias) => normalized.includes(normalizeLookup(alias)))) {
      return item.canonical;
    }
  }

  return normalized.replace(/\s+/g, "_");
}

function canonicalizeIngredientTerm(value: string) {
  const normalized = normalizeLookup(value);

  for (const item of INGREDIENT_ALIASES) {
    if (item.aliases.some((alias) => normalized.includes(normalizeLookup(alias)))) {
      return item.canonical;
    }
  }

  return normalized;
}

function looksLikeBareIngredient(value: string) {
  const normalized = normalizeLookup(value);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length > 3) return false;

  return INGREDIENT_ALIASES.some((item) =>
    item.aliases.some((alias) => normalized.includes(normalizeLookup(alias)))
  );
}

function cleanCurrentFoodName(value: unknown, excludedIngredients: string[]) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  const canonical = canonicalizeIngredientTerm(cleaned);
  const excluded = new Set(excludedIngredients.map(normalizeLookup));

  if (looksLikeBareIngredient(cleaned) && excluded.has(normalizeLookup(canonical))) {
    return null;
  }

  return cleaned;
}

function cleanIngredientArray(value: unknown) {
  return cleanStringArray(value).map(canonicalizeIngredientTerm);
}

function cleanAllergyArray(value: unknown) {
  return cleanStringArray(value).map((item) =>
    looksLikeBareIngredient(item) ? canonicalizeIngredientTerm(item) : item
  );
}

function allergyIngredientTerms(allergies: string[]) {
  const canonicalIngredients = new Set<string>(
    INGREDIENT_ALIASES.map((item) => item.canonical)
  );

  return allergies.filter((item) =>
    canonicalIngredients.has(normalizeLookup(item))
  );
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

  const allergies = cleanAllergyArray(input.allergies);
  const excludedIngredients = cleanIngredientArray(input.excludedIngredients);
  const effectiveExcludedIngredients = [
    ...excludedIngredients,
    ...allergyIngredientTerms(allergies),
  ];
  const preferredProteins = removeExcludedFromPreferred(
    cleanIngredientArray(input.preferredProteins),
    effectiveExcludedIngredients
  );

  const data: AiIntakeExtraction = {
    species,
    petName: cleanPetName(input.petName),
    weightKg: cleanWeight,
    ageYears: cleanAge,
    activityLevel,
    neutered:
      typeof input.neutered === "boolean" ? input.neutered : null,
    healthIssues: cleanStringArray(input.healthIssues),
    allergies,
    currentFoodName: cleanCurrentFoodName(input.currentFoodName, effectiveExcludedIngredients),
    preferredProteins,
    excludedIngredients,
    weightGoal,
    language: input.language === "en" ? "en" : input.language === "el" ? "el" : null,
    missingFields: cleanStringArray(input.missingFields),
    redFlags: cleanStringArray(input.redFlags).map(canonicalizeRedFlagTerm),
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
