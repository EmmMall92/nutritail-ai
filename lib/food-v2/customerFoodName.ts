import { normalizeBrandlessFoodDisplayName } from "@/lib/food-v2/canonicalFood";

type FoodNameInput = {
  brand?: string | null;
  display_name?: string | null;
  formula_name?: string | null;
};

const LEGACY_GREEK_MOJIBAKE_PATTERN =
  /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;

let isoGreekReverseMap: Map<string, number> | null = null;

const PACK_SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:g|gr|gram|grams|kg|kgs|kilogram|kilograms|lb|lbs)\b/gi;

const MULTIPACK_SIZE_PATTERN =
  /\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|kg|gr|gram|grams|kilogram|kilograms|lb|lbs)\b/gi;

function repairKnownGreekFoodTokens(value: string) {
  return value
    .replace(
      /\u039e\u009a\u039e\u038f\u039f\u201e\u039f\u008c\u039f\u20ac\u039e\u038f\u039f\u2026\u039e\u00bb\u039e\u038f/gu,
      "Κοτόπουλο"
    )
    .replace(/\u039e\u0385\u039f\u008d\u039e\u00b6\u039e\u0389/gu, "Ρύζι")
    .replace(/\u0395\u03cd\u03b6\u03b9/gu, "Ρύζι");
}

function getIsoGreekReverseMap() {
  if (isoGreekReverseMap) return isoGreekReverseMap;

  const decoder = new TextDecoder("iso-8859-7");
  isoGreekReverseMap = new Map<string, number>();

  for (let byte = 0; byte <= 255; byte += 1) {
    isoGreekReverseMap.set(decoder.decode(Uint8Array.of(byte)), byte);
  }

  return isoGreekReverseMap;
}

function repairLegacyGreekMojibake(value: string) {
  if (!LEGACY_GREEK_MOJIBAKE_PATTERN.test(value)) return value;

  const candidatePattern = /[\u0080-\u00ff\u0370-\u03ff]+/gu;

  return value.replace(candidatePattern, (candidate) => {
    if (!LEGACY_GREEK_MOJIBAKE_PATTERN.test(candidate)) return candidate;

    const repaired = repairLegacyGreekMojibakeSegment(candidate);
    return repaired ?? candidate;
  });
}

function repairLegacyGreekMojibakeSegment(value: string) {
  const reverseMap = getIsoGreekReverseMap();
  const bytes: number[] = [];

  for (const char of value) {
    const byte = reverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return null;
    }
  }

  const repaired = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  return repaired.includes("\ufffd") ? null : repaired;
}

function cleanNamePart(value: unknown) {
  return repairKnownGreekFoodTokens(
    repairLegacyGreekMojibake(repairKnownGreekFoodTokens(String(value ?? "")))
  )
    .replace(/\u0392\u00ae/g, "\u00ae")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeForCompare(value: string) {
  return cleanNamePart(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function collapseRepeatedCustomerTokens(value: string) {
  const repeatedTokens = [
    "adult",
    "active",
    "happy",
    "junior",
    "kitten",
    "large",
    "light",
    "maintenance",
    "medium",
    "mini",
    "puppy",
    "renal",
    "sensitive",
    "senior",
    "small",
    "sterilised",
    "sterilized",
    "urinary",
    "vetsolution",
  ];

  return repeatedTokens.reduce(
    (current, token) =>
      current.replace(
        new RegExp(`\\b(${escapeRegExp(token)})(?:\\s+\\1)+\\b`, "gi"),
        "$1"
      ),
    value
  );
}

function repairPossessiveBrandTail(brand: string, displayName: string) {
  if (!brand) return displayName;

  const possessiveMatch = displayName.match(/^,?\s*['’]s\s+(.+)$/i);
  if (!possessiveMatch) return displayName;

  return `${brand}'s ${possessiveMatch[1]}`.replace(/\s+/g, " ").trim();
}

function removeCustomerPackAndPromoText(displayName: string) {
  return displayName
    .replace(MULTIPACK_SIZE_PATTERN, " ")
    .replace(/\+\s*\d+(?:[.,]\d+)?\s*(?:g|gr|kg|kgs)\b/gi, " ")
    .replace(PACK_SIZE_PATTERN, " ")
    .replace(/\b\d+\s*x\b/gi, " ")
    .replace(/\b(?:try\s+now|free\s+pack|gift|doro|dwro)\b/gi, " ")
    .replace(/\s*[-!]\s*$/g, " ")
    .replace(/\s+-\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function customerFoodDisplayName(food: FoodNameInput) {
  const brand = cleanNamePart(food.brand);
  let displayName = cleanNamePart(food.display_name);
  if (!displayName) return "";

  displayName = repairPossessiveBrandTail(brand, displayName);

  const normalizedBrand = normalizeForCompare(brand);
  const normalizedDisplay = normalizeForCompare(displayName);

  if (brand && normalizedDisplay.startsWith(`${normalizedBrand} `)) {
    displayName = displayName.slice(brand.length).trim();
  }

  if (normalizedBrand === "purina pro plan") {
    displayName = displayName
      .replace(/^pro\s*plan(?:\s*[\u00ae\u0392\u03b2]\s*)?/i, "")
      .replace(
        /^veterinary\s+diets?\s+pro\s*plan(?:\s*[\u00ae\u0392\u03b2]\s*)?/i,
        "Veterinary Diets "
      )
      .trim();
  }

  if (normalizedBrand === "purina pro plan veterinary diets") {
    displayName = displayName
      .replace(/^pro\s*plan(?:\s*[\u00ae\u0392\u03b2]\s*)?\s*/i, "")
      .replace(/^veterinary\s+diets?\s+/i, "")
      .trim();
  }

  if (normalizedBrand === "happy dog") {
    displayName = displayName.replace(/^happy\s+/i, "").trim();
  }

  const firstBrandWord = brand.split(/\s+/)[0];
  if (firstBrandWord) {
    displayName = displayName.replace(
      new RegExp(`^${escapeRegExp(firstBrandWord)}\\s+${escapeRegExp(firstBrandWord)}\\s+`, "i"),
      `${firstBrandWord} `
    );
  }

  displayName = collapseRepeatedCustomerTokens(displayName);

  if (normalizedBrand === "happy dog") {
    displayName = displayName.replace(/^happy\s+/i, "").trim();
  }

  let cleanedDisplayName = removeCustomerPackAndPromoText(
    displayName
      .replace(/\b(happy)(?:\s+\1)+\b/gi, "$1")
      .replace(/\b(vetsolution)(?:\s+\1)+\b/gi, "$1")
      .replace(/\b(pro\s*plan)(?:\s+\1)+\b/gi, "$1")
      .replace(/\s+\+\s*$/g, "")
      .replace(/\s+-\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (
    brand &&
    normalizeForCompare(cleanedDisplayName).startsWith(`${normalizedBrand} `)
  ) {
    cleanedDisplayName = cleanedDisplayName.slice(brand.length).trim();
  }

  return (
    normalizeBrandlessFoodDisplayName({
      brand,
      display_name: cleanedDisplayName,
      formula_name: food.formula_name,
    }) || cleanedDisplayName
  );
}

export function customerFoodName(food: FoodNameInput, separator = " - ") {
  const brand = cleanNamePart(food.brand);
  const displayName = customerFoodDisplayName(food);

  if (!brand) return displayName || "Unknown food";
  if (!displayName) return brand;
  if (normalizeForCompare(displayName).startsWith(normalizeForCompare(brand))) {
    return displayName;
  }

  return [brand, displayName].filter(Boolean).join(separator);
}
