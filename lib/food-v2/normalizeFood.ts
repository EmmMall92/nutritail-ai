import type {
  DogSize,
  FoodFormat,
  LifeStage,
  Species,
} from "@/types/food-v2";

const PACK_SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:g|gr|gram|grams|kg|kgs|kilogram|kilograms|lb|lbs)\b/gi;

const ANIMAL_PROTEIN_TERMS = [
  "chicken",
  "turkey",
  "duck",
  "lamb",
  "beef",
  "pork",
  "salmon",
  "fish",
  "herring",
  "cod",
  "sardine",
  "tuna",
  "rabbit",
  "venison",
  "egg",
  "κοτοπουλο",
  "γαλοπουλα",
  "παπια",
  "αρνι",
  "μοσχαρι",
  "σολομος",
  "ψαρι",
];

const CARBOHYDRATE_TERMS = [
  "rice",
  "maize",
  "corn",
  "wheat",
  "barley",
  "oats",
  "potato",
  "sweet potato",
  "pea",
  "lentil",
  "tapioca",
  "millet",
  "sorghum",
  "ρυζι",
  "καλαμποκι",
  "σιταρι",
  "πατατα",
  "αρακα",
];

const FAT_TERMS = [
  "fat",
  "oil",
  "chicken fat",
  "fish oil",
  "salmon oil",
  "sunflower oil",
  "flaxseed",
  "linseed",
  "algal oil",
  "λιπος",
  "ελαιο",
  "λαδι",
];

const FIBER_TERMS = [
  "beet pulp",
  "chicory",
  "inulin",
  "psyllium",
  "cellulose",
  "fiber",
  "fibre",
  "fos",
  "mos",
  "ινουλινη",
  "κυτταρινη",
];

function cleanText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value: string) {
  return normalizeSearchText(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9α-ω]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueByNormalized(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    const key = normalizeSearchText(cleaned);
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function detectTerms(ingredients: string[], terms: string[]) {
  return uniqueByNormalized(
    ingredients.filter((ingredient) => {
      const normalized = normalizeSearchText(ingredient);
      return terms.some((term) => normalized.includes(normalizeSearchText(term)));
    })
  );
}

export function normalizeBrand(value: unknown) {
  return cleanText(value)
    .replace(/\broyal\s+canine\b/i, "Royal Canin")
    .replace(/\bproplan\b/i, "Pro Plan");
}

export function normalizeFormulaName(value: unknown) {
  return cleanText(value)
    .replace(PACK_SIZE_PATTERN, "")
    .replace(/\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|kg)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[-–—]\s*$/g, "")
    .trim();
}

export function createFormulaKey({
  brand,
  formula_name,
  species,
  format,
}: {
  brand: string;
  formula_name: string;
  species: Species | string;
  format: FoodFormat | string;
}) {
  return [brand, formula_name, species, format].map(slugify).join("|");
}

export function normalizeSpecies(value: unknown): Species {
  const text = normalizeSearchText(value);
  if (text.includes("cat") || text.includes("γατ") || text.includes("gata")) {
    return "cat";
  }
  return "dog";
}

export function normalizeFoodFormat(value: unknown): FoodFormat {
  const text = normalizeSearchText(value);
  if (text.includes("wet") || text.includes("can") || text.includes("pouch")) {
    return "wet";
  }
  if (text.includes("treat") || text.includes("snack")) return "treat";
  if (text.includes("supplement")) return "supplement";
  return "dry";
}

export function normalizeLifeStage(value: unknown): LifeStage {
  const text = normalizeSearchText(value);
  if (text.includes("puppy") || text.includes("junior") || text.includes("κουταβ")) {
    return "puppy";
  }
  if (text.includes("kitten") || text.includes("γατακι")) return "kitten";
  if (text.includes("senior") || text.includes("mature") || text.includes("ηλικιω")) {
    return "senior";
  }
  if (text.includes("all life") || text.includes("all stages")) {
    return "all_life_stages";
  }
  if (text.includes("adult") || text.includes("ενηλικ")) return "adult";
  return "unknown";
}

export function normalizeDogSize(value: unknown): DogSize {
  const text = normalizeSearchText(value);
  if (text.includes("mini")) return "mini";
  if (text.includes("small") || text.includes("μικρο")) return "small";
  if (text.includes("medium") || text.includes("μεσα")) return "medium";
  if (text.includes("giant")) return "giant";
  if (text.includes("large") || text.includes("maxi") || text.includes("μεγαλ")) {
    return "large";
  }
  if (text.includes("all")) return "all";
  return "unknown";
}

export function normalizeMedicalTags(text: unknown) {
  const value = normalizeSearchText(text);
  const tags: string[] = [];

  tags.push(...generateMedicalTags(text));
  if (value.includes("obese") || value.includes("obesity")) tags.push("obesity");
  if (value.includes("renal") || value.includes("kidney")) tags.push("renal");
  if (value.includes("light") || value.includes("weight")) {
    tags.push("weight_management");
  }
  if (value.includes("digest")) tags.push("digestive_support");
  if (value.includes("hypoallergenic") || value.includes("allergy")) {
    tags.push("allergy_support");
  }
  if (value.includes("senior")) tags.push("senior_support");

  return [...new Set(tags)];
}

export function normalizeCommercialTags(text: unknown) {
  const value = normalizeSearchText(text);
  const tags: string[] = [];

  tags.push(...generateHealthTags(text));
  tags.push(...generateIngredientTags(text));
  if (value.includes("grain free") || value.includes("grain-free")) {
    tags.push("grain_free");
  }
  if (value.includes("low grain")) tags.push("low_grain");
  if (value.includes("fresh")) tags.push("fresh_meat");
  if (value.includes("indoor")) tags.push("indoor");
  if (value.includes("sterilised") || value.includes("sterilized")) {
    tags.push("sterilised");
  }

  return [...new Set(tags)];
}

export function generateHealthTags(text: unknown) {
  const value = normalizeSearchText(text);
  const tags: string[] = [];

  if (value.includes("sterilised") || value.includes("sterilized") || value.includes("neutered")) {
    tags.push("sterilised");
  }
  if (value.includes("urinary")) tags.push("urinary");
  if (value.includes("hairball")) tags.push("hairball");
  if (value.includes("sensitive") && value.includes("digest")) {
    tags.push("sensitive_digestion");
  }
  if (
    value.includes("weight") ||
    value.includes("light") ||
    value.includes("satiety") ||
    value.includes("obesity")
  ) {
    tags.push("weight_control");
  }
  if (value.includes("large") || value.includes("maxi") || value.includes("giant")) {
    tags.push("large_breed");
  }
  if (value.includes("small") || value.includes("mini")) {
    tags.push("small_breed");
  }
  if (value.includes("puppy") || value.includes("junior")) tags.push("puppy");
  if (value.includes("kitten")) tags.push("kitten");
  if (value.includes("senior") || value.includes("mature") || value.includes("8+")) {
    tags.push("senior");
  }

  return [...new Set(tags)];
}

export function generateIngredientTags(text: unknown) {
  const value = normalizeSearchText(text);
  const tags: string[] = [];

  if (value.includes("chicken")) tags.push("chicken");
  if (value.includes("duck")) tags.push("duck");
  if (value.includes("lamb")) tags.push("lamb");
  if (value.includes("salmon")) tags.push("salmon");
  if (value.includes("fish") || value.includes("herring") || value.includes("cod") || value.includes("sardine") || value.includes("tuna")) {
    tags.push("fish");
  }
  if (value.includes("grain free") || value.includes("grain-free")) {
    tags.push("grain_free");
  }
  if (value.includes("rice")) tags.push("rice");
  if (value.includes("corn") || value.includes("maize")) tags.push("corn");
  if (value.includes("pea")) tags.push("pea");
  if (value.includes("potato")) tags.push("potato");

  return [...new Set(tags)];
}

export function generateMedicalTags(text: unknown) {
  const value = normalizeSearchText(text);
  const tags: string[] = [];

  if (value.includes("obesity") || value.includes("weight") || value.includes("satiety")) {
    tags.push("obesity");
  }
  if (value.includes("urinary") || value.includes("struvite")) tags.push("urinary");
  if (value.includes("renal") || value.includes("kidney")) tags.push("renal");
  if (value.includes("allergy") || value.includes("hypoallergenic")) tags.push("allergy");
  if (value.includes("gastro") || value.includes("digest") || value.includes("intestinal")) {
    tags.push("gi_support");
  }

  return [...new Set(tags)];
}

export function normalizeIngredientText(value: unknown) {
  const cleaned = cleanText(value)
    .replace(/[;；]/g, ",")
    .replace(/\s*,\s*/g, ", ");

  return cleaned || null;
}

export function splitIngredients(value: unknown) {
  const text = normalizeIngredientText(value);
  if (!text) return [];

  const ingredients: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      ingredients.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  ingredients.push(current);
  return dedupeIngredients(ingredients);
}

export function dedupeIngredients(ingredients: string[]) {
  return uniqueByNormalized(ingredients);
}

export function detectPrimaryAnimalProteins(ingredients: string[]) {
  return detectTerms(ingredients, ANIMAL_PROTEIN_TERMS);
}

export function detectCarbohydrateSources(ingredients: string[]) {
  return detectTerms(ingredients, CARBOHYDRATE_TERMS);
}

export function detectFatSources(ingredients: string[]) {
  return detectTerms(ingredients, FAT_TERMS);
}

export function detectFiberSources(ingredients: string[]) {
  return detectTerms(ingredients, FIBER_TERMS);
}

export function normalizePercent(value: unknown) {
  const numeric = parseNumber(value);
  if (numeric === null) return null;

  const text = normalizeSearchText(value);
  if (text.includes("mg/kg")) return numeric / 10000;
  if (text.includes("g/kg")) return numeric / 10;

  return numeric;
}

export function normalizeMgKg(value: unknown) {
  const numeric = parseNumber(value);
  return numeric;
}

export function normalizeEnergyToKcalPer100g(value: unknown, unit: unknown) {
  const numeric = parseNumber(value);
  if (numeric === null) return null;

  const normalizedUnit = normalizeSearchText(unit);
  if (normalizedUnit.includes("kcal/kg")) return numeric / 10;
  if (normalizedUnit.includes("mj/kg")) return (numeric * 239.006) / 10;
  if (normalizedUnit.includes("kcal/100g")) return numeric;

  return numeric;
}
