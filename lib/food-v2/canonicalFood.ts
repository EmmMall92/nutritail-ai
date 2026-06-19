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
  "dry cat food",
  "cat dry food",
  "dry food",
  "xira trofi skylou",
  "ksira trofi skylou",
  "xira trofi gatas",
  "ksira trofi gatas",
  "trofi skylou",
  "trofes skylon",
  "trofi gatas",
  "trofes gaton",
  "for dogs",
  "for cats",
  "dogs",
  "dog",
  "skylou",
  "skylos",
  "gatas",
  "gata",
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

function dedupeRepeatedDisplayTerms(value: string) {
  return value
    .replace(/\b(vetsolution)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(veterinary)(?:\s+\1)+\b/gi, "$1")
    .replace(
      /\b(urinary|renal|senior|puppy|kitten|junior|adult|mature|maintenance|mini|small|medium|large|giant|maxi|xsmall|light|sterilised|sterilized|neutered|sensitive|digestive)(?:\s+\1)+\b/gi,
      "$1"
    )
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeFoodTokenAliases(normalizeSearchText(value))
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeFoodTokenAliases(value: string) {
  return value
    .replace(/\u03bc\u03b5/gu, " ")
    .replace(/\u03ba\u03b1\u03b9/gu, " and ")
    .replace(/\u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf/gu, " chicken ")
    .replace(/\u03c7\u03bf\u03b9\u03c1\u03b9\u03bd\u03bf/gu, " pork ")
    .replace(/\u03c0\u03c1\u03bf\u03c3\u03bf\u03c5\u03c4\u03bf/gu, " ham ")
    .replace(/\u03c8\u03b1\u03c1\u03b9/gu, " fish ")
    .replace(/\u03c1\u03c5\u03b6\u03b9/gu, " rice ")
    .replace(/\u03c4\u03bf\u03bd\u03bf\u03c2/gu, " tuna ")
    .replace(/\u03c4\u03bf\u03bd\u03bf/gu, " tuna ")
    .replace(/\u03b1\u03c1\u03bd\u03b9/gu, " lamb ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf\u03c2/gu, " salmon ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf/gu, " salmon ")
    .replace(/\u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9/gu, " beef ")
    .replace(/\u03b2\u03bf\u03b4\u03b9\u03bd\u03bf/gu, " beef ")
    .replace(/\u03c0\u03b1\u03c0\u03b9\u03b1/gu, " duck ")
    .replace(/\u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03c5\u03bb\u03b1/gu, " turkey ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b5\u03c2/gu, " shrimp ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b1/gu, " shrimp ")
    .replace(/\s+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeGreekFoodTokens(value: string) {
  return value
    .replace(/\bμε\b/gu, " ")
    .replace(/\bκαι\b/gu, " and ")
    .replace(/\bκοτοπουλο\b/gu, " chicken ")
    .replace(/\bχοιρινο\b/gu, " pork ")
    .replace(/\bπροσουτο\b/gu, " ham ")
    .replace(/\bψαρι\b/gu, " fish ")
    .replace(/\bρυζι\b/gu, " rice ")
    .replace(/\bτονος\b/gu, " tuna ")
    .replace(/\bτονο\b/gu, " tuna ")
    .replace(/\bαρνι\b/gu, " lamb ")
    .replace(/\bσολομος\b/gu, " salmon ")
    .replace(/\bσολομο\b/gu, " salmon ")
    .replace(/\bμοσχαρι\b/gu, " beef ")
    .replace(/\bβοδινο\b/gu, " beef ")
    .replace(/\bπαπια\b/gu, " duck ")
    .replace(/\bγαλοπουλα\b/gu, " turkey ")
    .replace(/\bγαριδα\b/gu, " shrimp ")
    .replace(/\bγαριδες\b/gu, " shrimp ")
    .replace(/\s+/g, " ")
    .trim();
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
    dedupeRepeatedDisplayTerms(removeNoiseWords(cleanText(value)))
      .replace(PACK_SIZE_PATTERN, " ")
      .replace(/\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|kg|gr)\b/gi, " ")
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:\+?\s*free|pack|bags?)\b/gi, " ")
      .replace(/[|_]+/g, " ")
      .replace(/\s*[-–—]\s*$/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function normalizeBrandlessFoodDisplayName({
  brand,
  display_name,
  formula_name,
}: {
  brand: string;
  display_name?: string | null;
  formula_name?: string | null;
}) {
  const cleanedBrand = normalizeCanonicalFormulaName(brand);
  const fallback = normalizeCanonicalFormulaName(formula_name);
  let cleanedDisplay = normalizeCanonicalFormulaName(display_name) || fallback;

  if (!cleanedDisplay) return "";

  const normalizedBrand = normalizeSearchText(cleanedBrand);
  let normalizedDisplay = normalizeSearchText(cleanedDisplay);

  while (
    normalizedBrand &&
    (normalizedDisplay === normalizedBrand ||
      normalizedDisplay.startsWith(`${normalizedBrand} `))
  ) {
    cleanedDisplay = cleanedDisplay.slice(cleanedBrand.length).trim();
    normalizedDisplay = normalizeSearchText(cleanedDisplay);
  }

  return dedupeRepeatedDisplayTerms(cleanedDisplay)
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeBrandlessFormulaName({
  brand,
  formula_name,
}: {
  brand: string;
  formula_name?: string | null;
}) {
  const cleanedFormula = normalizeCanonicalFormulaName(formula_name);
  if (!cleanedFormula) return "";

  return (
    normalizeBrandlessFoodDisplayName({
      brand,
      display_name: cleanedFormula,
      formula_name: cleanedFormula,
    }) || cleanedFormula
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
  const aliasedFormulaName = applyBrandFormulaAlias(brand, formula_name);

  return [
    slugify(brand),
    normalizeCanonicalFormulaKeyPart(aliasedFormulaName),
    slugify(String(species)),
    slugify(String(format)),
  ]
    .filter(Boolean)
    .join("|");
}

function applyBrandFormulaAlias(brand: unknown, formulaName: unknown) {
  const normalizedBrand = normalizeSearchText(brand);
  let normalizedFormula = normalizeFoodTokenAliases(normalizeSearchText(formulaName))
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedBrand !== "schesir") return formulaName;
  if (normalizedFormula.startsWith(`${normalizedBrand} `)) {
    normalizedFormula = normalizedFormula.slice(normalizedBrand.length + 1).trim();
  }

  const normalizedAliases: Array<[RegExp, string]> = [
    [/^dry medium maintenance(?: chicken)?$/u, "Adult Medium Chicken"],
    [/^adult medium chicken$/u, "Adult Medium Chicken"],
    [/^dry small maintenance(?: dog| chicken)?$/u, "Adult Small Chicken Rice"],
    [/^adult small(?: chicken and rice| chicken rice)$/u, "Adult Small Chicken Rice"],
    [/^dry kitten(?: chicken)?$/u, "Kitten Chicken"],
    [/^kitten chicken$/u, "Kitten Chicken"],
    [/^cat sterilized and light(?: chicken)?$/u, "Sterilized Light Chicken"],
    [/^sterili[sz]ed cat chicken$/u, "Sterilized Light Chicken"],
  ];

  for (const [pattern, replacement] of normalizedAliases) {
    if (pattern.test(normalizedFormula)) return replacement;
  }

  const schesirAliases: Array<[RegExp, string]> = [
    [/^dry medium maintenance(?: chicken| με κοτοπουλο)?$/u, "Adult Medium Chicken"],
    [/^adult medium(?: με κοτοπουλο| chicken)$/u, "Adult Medium Chicken"],
    [/^dry small maintenance(?: dog| με κοτοπουλο)?$/u, "Adult Small Chicken Rice"],
    [/^adult small(?: με κοτοπουλο and ρυζι| chicken rice)$/u, "Adult Small Chicken Rice"],
    [/^dry kitten(?: με κοτοπουλο| chicken)?$/u, "Kitten Chicken"],
    [/^kitten(?: με κοτοπουλο| chicken)$/u, "Kitten Chicken"],
    [/^cat sterilized and light(?: με κοτοπουλο| chicken)?$/u, "Sterilized Light Chicken"],
    [/^sterili[sz]ed cat(?: με κοτοπουλο| chicken)$/u, "Sterilized Light Chicken"],
  ];

  for (const [pattern, replacement] of schesirAliases) {
    if (pattern.test(normalizedFormula)) return replacement;
  }

  return formulaName;
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
