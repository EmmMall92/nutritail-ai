import type {
  FoodDataQualityStatus,
  NormalizedDogLifeStage,
  NormalizedDogSize,
  NormalizedFoodRow,
  RawFoodRow,
} from "@/types/food-dataset";
import { percentFromUnit } from "@/lib/import/foodUnitConversions";

const NULL_STRINGS = new Set([
  "",
  "-",
  "n/a",
  "na",
  "null",
  "none",
  "unknown",
  "not available",
]);

const BRAND_OVERRIDES: Record<string, string> = {
  "royal canin": "Royal Canin",
};

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined);
}

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const cleaned = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[;,|]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  if (NULL_STRINGS.has(cleaned.toLowerCase())) return null;

  return cleaned;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function splitListValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(splitListValue);
  }

  const cleaned = cleanText(value);
  if (!cleaned) return [];

  return cleaned
    .split(/[,;\n|]+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item && !NULL_STRINGS.has(item.toLowerCase()));
}

function uniqueByLowercase(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  values.forEach((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    unique.push(value);
  });

  return unique;
}

function parseLocalizedNumber(value: string): number | null {
  const match = value.match(/[+-]?\d[\d.,]*/);
  if (!match) return null;

  const token = match[0];
  const hasComma = token.includes(",");
  const hasDot = token.includes(".");

  let normalized = token;

  if (hasComma && hasDot) {
    const lastComma = token.lastIndexOf(",");
    const lastDot = token.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";

    normalized = token
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else if (hasComma) {
    const parts = token.split(",");
    const lastPart = parts.at(-1) ?? "";
    const commaLooksLikeThousands =
      parts.length > 1 && lastPart.length === 3 && parts[0].length <= 3;

    normalized = commaLooksLikeThousands
      ? token.replace(/,/g, "")
      : token.replace(/,/g, ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeNullableString(value: unknown): string | null {
  return cleanText(value);
}

export function normalizeBrand(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const key = cleaned.toLowerCase();
  return BRAND_OVERRIDES[key] ?? toTitleCase(cleaned);
}

export function normalizeLifeStage(
  value: unknown
): NormalizedDogLifeStage | null {
  const cleaned = cleanText(value)?.toLowerCase();
  if (!cleaned) return null;

  if (["puppy", "junior", "young", "growth", "kitten"].includes(cleaned)) {
    return "young";
  }

  if (["adult", "mature", "maintenance"].includes(cleaned)) {
    return "adult";
  }

  if (["senior", "ageing", "aging", "elderly", "mature adult"].includes(cleaned)) {
    return "senior";
  }

  if (
    ["all", "all ages", "all life stages", "all-life-stages"].includes(cleaned)
  ) {
    return "all";
  }

  return null;
}

export function normalizeDogSize(value: unknown): NormalizedDogSize | null {
  const cleaned = cleanText(value)?.toLowerCase();
  if (!cleaned) return null;

  if (["x-small", "extra small", "mini", "toy"].includes(cleaned)) return "mini";
  if (["small", "small dog"].includes(cleaned)) return "small";
  if (["medium", "med", "medium dog"].includes(cleaned)) return "medium";
  if (["large", "maxi", "large dog"].includes(cleaned)) return "large";
  if (["giant", "giant dog"].includes(cleaned)) return "giant";
  if (["all", "all sizes", "all breeds"].includes(cleaned)) return "all";

  return null;
}

export function normalizeTags(value: unknown): string[] {
  return uniqueByLowercase(
    splitListValue(value).map((tag) => tag.toLowerCase())
  );
}

export function normalizeIngredients(value: unknown): string[] {
  return uniqueByLowercase(
    splitListValue(value).map((ingredient) =>
      ingredient.replace(/\s*,\s*/g, ", ").trim()
    )
  );
}

export function normalizeNutritionValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  const parsed = parseLocalizedNumber(lower);

  if (parsed === null) return null;

  if (lower.includes("mg/kg")) {
    return percentFromUnit(parsed, "mg_per_kg");
  }

  if (lower.includes("g/kg")) {
    return percentFromUnit(parsed, "g_per_kg");
  }

  return parsed;
}

export function normalizeDataQualityStatus(
  value: unknown
): FoodDataQualityStatus {
  const cleaned = cleanText(value)?.toLowerCase();

  if (
    cleaned === "verified" ||
    cleaned === "partial" ||
    cleaned === "needs_review" ||
    cleaned === "unknown"
  ) {
    return cleaned;
  }

  if (cleaned === "needs review" || cleaned === "review") return "needs_review";

  return "unknown";
}

export function normalizeSpecies(value: unknown): "dog" | null {
  const cleaned = cleanText(value)?.toLowerCase();
  if (!cleaned) return null;

  return cleaned === "dog" || cleaned === "dogs" || cleaned === "canine"
    ? "dog"
    : null;
}

export function normalizeFoodRow(row: RawFoodRow): NormalizedFoodRow {
  return {
    id: normalizeNullableString(row.id),
    brand: normalizeBrand(row.brand),
    name: normalizeNullableString(row.name),
    species: normalizeSpecies(row.species),
    life_stage: normalizeLifeStage(firstValue(row.life_stage, row.lifeStage)),
    size: normalizeDogSize(row.size),
    tags: normalizeTags(row.tags),
    ingredients: normalizeIngredients(row.ingredients),
    kcal_per_100g: normalizeNutritionValue(
      firstValue(row.kcal_per_100g, row.kcalPer100g)
    ),
    protein_percent: normalizeNutritionValue(
      firstValue(row.protein_percent, row.proteinPercent, row.protein)
    ),
    fat_percent: normalizeNutritionValue(
      firstValue(row.fat_percent, row.fatPercent, row.fat)
    ),
    fiber_percent: normalizeNutritionValue(
      firstValue(row.fiber_percent, row.fiberPercent, row.fiber)
    ),
    sodium_percent: normalizeNutritionValue(
      firstValue(row.sodium_percent, row.sodiumPercent, row.sodium)
    ),
    magnesium_percent: normalizeNutritionValue(
      firstValue(row.magnesium_percent, row.magnesiumPercent, row.magnesium)
    ),
    calcium_percent: normalizeNutritionValue(
      firstValue(row.calcium_percent, row.calciumPercent, row.calcium)
    ),
    phosphorus_percent: normalizeNutritionValue(
      firstValue(row.phosphorus_percent, row.phosphorusPercent, row.phosphorus)
    ),
    data_quality_status: normalizeDataQualityStatus(
      firstValue(row.data_quality_status, row.dataQualityStatus)
    ),
    data_source_url: normalizeNullableString(
      firstValue(row.data_source_url, row.dataSourceUrl)
    ),
    data_notes: normalizeNullableString(firstValue(row.data_notes, row.dataNotes)),
    completeness_score: 0,
  };
}
