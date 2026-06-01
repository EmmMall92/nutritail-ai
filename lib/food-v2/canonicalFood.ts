import type {
  DogSize,
  FoodFormat,
  FoodProductV2,
  LifeStage,
  Species,
} from "@/types/food-v2";

const PACK_SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:g|gr|gram|grams|kg|kgs|kilogram|kilograms|lb|lbs)\b/gi;

const SOURCE_SUFFIX_PATTERN =
  /(?:^|[-_\s|])(?:official|retailer|document|spreadsheet|pdf|ods|html|mhtml|photo|manual|source|gatoskilo|petshop88|zooplus|petsamolis|royal-canin-gr|gr|eu|uk)(?=$|[-_\s|])/gi;

const NOISE_WORDS = [
  "dry dog food",
  "dog dry food",
  "dry food",
  "xira trofi skylou",
  "ksira trofi skylou",
  "trofi skylou",
  "trofes skylon",
  "for dogs",
  "dogs",
  "dog",
  "skylou",
  "skylos",
  "gamma",
  "eshop",
];

const DOG_SIZE_LABELS: Record<DogSize, string> = {
  mini: "Mini",
  small: "Small",
  medium: "Medium",
  large: "Large",
  giant: "Giant",
  all: "",
  unknown: "",
};

const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  puppy: "Puppy",
  kitten: "Kitten",
  adult: "Adult",
  senior: "Senior",
  all_life_stages: "All Life Stages",
  unknown: "",
};

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

function titleCaseToken(token: string) {
  if (/^[A-Z0-9+&/-]{2,}$/.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function slugify(value: string) {
  return normalizeSearchText(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function removeNoiseWords(value: string) {
  let cleaned = value;

  for (const word of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }

  return cleaned;
}

export function normalizeCanonicalFormulaName(value: unknown) {
  return titleCase(
    removeNoiseWords(cleanText(value))
      .replace(PACK_SIZE_PATTERN, " ")
      .replace(/\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|kg|gr)\b/gi, " ")
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:\+?\s*free|pack|bags?)\b/gi, " ")
      .replace(/[|_]+/g, " ")
      .replace(/\s*[-–—]\s*$/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function normalizeCanonicalFormulaKeyPart(value: unknown) {
  return slugify(
    normalizeCanonicalFormulaName(value)
      .replace(SOURCE_SUFFIX_PATTERN, " ")
      .replace(/\s+/g, " ")
  );
}

export function createCanonicalFormulaKey({
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
  return [
    slugify(brand),
    normalizeCanonicalFormulaKeyPart(formula_name),
    slugify(String(species)),
    slugify(String(format)),
  ]
    .filter(Boolean)
    .join("|");
}

export function createStandardDisplayName(food: {
  brand: string;
  formula_name: string;
  life_stage?: LifeStage | null;
  dog_size?: DogSize | null;
}) {
  const brand = cleanText(food.brand);
  const formula = normalizeCanonicalFormulaName(food.formula_name);
  const lifeStage = food.life_stage ? LIFE_STAGE_LABELS[food.life_stage] : "";
  const dogSize = food.dog_size ? DOG_SIZE_LABELS[food.dog_size] : "";
  const normalizedFormula = normalizeSearchText(formula);
  const helperParts = [dogSize, lifeStage].filter(
    (part) => part && !normalizedFormula.includes(normalizeSearchText(part))
  );

  return [brand, ...helperParts, formula]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ensureBrandInDisplayName({
  brand,
  display_name,
  formula_name,
  life_stage,
  dog_size,
}: {
  brand: string;
  display_name?: string | null;
  formula_name: string;
  life_stage?: LifeStage | null;
  dog_size?: DogSize | null;
}) {
  const cleanedBrand = cleanText(brand);
  const cleanedDisplay = normalizeCanonicalFormulaName(display_name);
  const fallback = createStandardDisplayName({
    brand: cleanedBrand,
    formula_name,
    life_stage,
    dog_size,
  });

  if (!cleanedDisplay) return fallback;

  const normalizedBrand = normalizeSearchText(cleanedBrand);
  const normalizedDisplay = normalizeSearchText(cleanedDisplay);

  if (
    normalizedBrand &&
    (normalizedDisplay === normalizedBrand ||
      normalizedDisplay.startsWith(`${normalizedBrand} `))
  ) {
    return cleanedDisplay;
  }

  return [cleanedBrand, cleanedDisplay]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalTitleSourceRank(source: {
  data_source_url?: string | null;
  source_notes?: string | null;
  source_priority?: string | null;
}) {
  const url = normalizeSearchText(source.data_source_url);
  const notes = normalizeSearchText(source.source_notes);
  const combined = `${url} ${notes}`;

  if (combined.includes("gatoskilo")) return 60;
  if (
    combined.includes(".pdf") ||
    combined.includes("source_tier=uploaded_document") ||
    combined.includes("source_tier=uploaded_pdf") ||
    combined.includes("source_kind=pdf") ||
    combined.includes("document_extract") ||
    combined.includes("pdf_extract")
  ) {
    return 50;
  }
  if (source.source_priority === "official") return 40;
  if (combined.includes("zooplus")) return 30;
  if (
    combined.includes("petshop88") ||
    combined.includes("pet-it") ||
    combined.includes("petcity")
  ) {
    return 25;
  }
  if (combined.includes("petsamolis")) return 10;
  if (source.source_priority === "retailer") return 20;
  if (source.source_priority === "manual_photo") return 5;
  return 0;
}

export function createCanonicalFoodIdentity(food: Pick<
  FoodProductV2,
  "brand" | "formula_name" | "species" | "format" | "life_stage" | "dog_size"
>) {
  return {
    canonical_formula_key: createCanonicalFormulaKey(food),
    standard_display_name: createStandardDisplayName(food),
  };
}

export function groupByCanonicalFormula<T>(
  rows: T[],
  getFood: (row: T) => Pick<
    FoodProductV2,
    "brand" | "formula_name" | "species" | "format" | "life_stage" | "dog_size"
  >
) {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = createCanonicalFoodIdentity(getFood(row)).canonical_formula_key;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([canonical_formula_key, group]) => ({
      canonical_formula_key,
      rows: group,
    }));
}
