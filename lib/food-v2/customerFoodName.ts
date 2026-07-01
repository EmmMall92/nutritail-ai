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

const UTF8_AS_LATIN_MOJIBAKE_PATTERN = /[\u00ce\u00cf\u00ee\u00ef][\u0080-\u00ff]/u;

function repairUtf8AsLatinMojibake(value: string) {
  if (!UTF8_AS_LATIN_MOJIBAKE_PATTERN.test(value)) return value;

  return value.replace(/[\u0080-\u00ff]+/gu, (candidate) => {
    if (!UTF8_AS_LATIN_MOJIBAKE_PATTERN.test(candidate)) return candidate;
    return repairUtf8AsLatinMojibakeSegment(candidate) ?? candidate;
  });
}

function repairUtf8AsLatinMojibakeSegment(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code > 255) return null;
    bytes.push(code);
  }

  const repaired = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  return repaired.includes("\ufffd") ? null : repaired;
}

function repairKnownGreekFoodTokens(value: string) {
  return value
    .replace(
      /\u039e\u009a\u039e\u038f\u039f\u201e\u039f\u008c\u039f\u20ac\u039e\u038f\u039f\u2026\u039e\u00bb\u039e\u038f/gu,
      "Κοτόπουλο"
    )
    .replace(/\u039e\u0385\u039f\u008d\u039e\u00b6\u039e\u0389/gu, "Ρύζι")
    .replace(/\u0395\u03cd\u03b6\u03b9/gu, "Ρύζι");
}

function normalizeCustomerGreekTokens(value: string) {
  return value
    .replace(/\u039e\u201c\u039e\u00b1\u039e\u00bb\u039e\u038f\u039f\u20ac\u039e\u038f\u039f\u008d\u039e\u00bb\u039e\u00b1/gu, "Γαλοπούλα")
    .replace(/\u039e"\u03be\u00b1\u03be\u00bb\u03be\u03ce\u03bf\u20ac\u03bf\u03cd\u03bb\u03b1/gu, "Γαλοπούλα")
    .replace(/Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚/g, "Σολομός")
    .replace(/Ξ£ΞΏΞ»ΞΏΞΌΞΏΟ‚/g, "Σολομός")
    .replace(/ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ/g, "Κοτόπουλο")
    .replace(/ΞΞΏΟ„ΞΏΟ€ΞΏΟ…Ξ»ΞΏ/g, "Κοτόπουλο")
    .replace(/Ξ‘ΟΞ½Ξ―/g, "Αρνί")
    .replace(/Ξ‘ΟΞ½ΞΉ/g, "Αρνί")
    .replace(/ΞΞΏΟƒΟ‡Ξ¬ΟΞΉ/g, "Μοσχάρι")
    .replace(/ΞΞΏΟƒΟ‡Ξ±ΟΞΉ/g, "Μοσχάρι")
    .replace(/Ξ¨Ξ¬ΟΞΉ/g, "Ψάρι")
    .replace(/ΟΞ¬ΟΞΉ/g, "Ψάρι")
    .replace(/ΟΞ±ΟΞΉ/g, "Ψάρι")
    .replace(/Ξ΅ΟΞ¶ΞΉ/g, "Ρύζι")
    .replace(/Ξ¡ΟΞ¶ΞΉ/g, "Ρύζι");
}

function repairCustomerGreekMojibake(value: string) {
  let current = String(value ?? "");

  for (let index = 0; index < 3; index += 1) {
    const next = normalizeCustomerGreekTokens(
      repairKnownGreekFoodTokens(
        repairLegacyGreekMojibake(
          repairUtf8AsLatinMojibake(repairKnownGreekFoodTokens(current))
        )
      )
    );

    if (next === current) {
      return polishReadableGreekFoodTokens(normalizeVisibleMojibakeFlavorTokens(current));
    }
    current = next;
  }

  return normalizeVisibleMojibakeFlavorTokens(current);
}

function normalizeVisibleMojibakeFlavorTokens(value: string) {
  value = value.replace(
    /\u039e\u201c\u039e\u00b1\u039e\u00bb\u039e\u038f\u039f\u20ac\u039e\u038f\u039f\u008d\u039e\u00bb\u039e\u00b1/gu,
    "Γαλοπούλα"
  );
  value = value.replace(
    /\u039e"\u03be\u00b1\u03be\u00bb\u03be\u03ce\u03bf\u20ac\u03bf\u03cd\u03bb\u03b1/gu,
    "Γαλοπούλα"
  );

  const replacements: Array<[string, string]> = [
    ["Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚", "Σολομός"],
    ["Ξ£ΞΏΞ»ΞΏΞΌΞΏΟ‚", "Σολομός"],
    ["ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ", "Κοτόπουλο"],
    ["ΞΞΏΟ„ΞΏΟ€ΞΏΟ…Ξ»ΞΏ", "Κοτόπουλο"],
    ["Ξ‘ΟΞ½Ξ―", "Αρνί"],
    ["Ξ‘ΟΞ½ΞΉ", "Αρνί"],
    ["ΞΞΏΟƒΟ‡Ξ¬ΟΞΉ", "Μοσχάρι"],
    ["ΞΞΏΟƒΟ‡Ξ±ΟΞΉ", "Μοσχάρι"],
    ["Ξ¨Ξ¬ΟΞΉΞ± Ξ©ΞΊΞµΞ±Ξ½ΞΏΟ", "Ψάρια Ωκεανού"],
    ["Ξ¨Ξ¬ΟΞΉ", "Ψάρι"],
    ["ΟΞ¬ΟΞΉ", "Ψάρι"],
    ["ΟΞ±ΟΞΉ", "Ψάρι"],
    ["Ξ΅ΟΞ¶ΞΉ", "Ρύζι"],
    ["Ξ¡ΟΞ¶ΞΉ", "Ρύζι"],
    ["ΞΞΏΟ…Ξ½Ξ­Ξ»ΞΉ", "Κουνέλι"],
    ["Ξ“Ξ±Ξ»ΞΏΟ€ΞΏΟΞ»Ξ±", "Γαλοπούλα"],
    ["ΞΞ±Ξ»ΞΏΟ€ΞΏΟΞ»Ξ±", "Γαλοπούλα"],
    ["ΞΞµ ", "Με "],
    ["ΞΒ£ΞΞΞΒ»ΞΞΞΞΞΒΞβ€", "Σολομός"],
    ["ΞΒ£ΞΞΞΒ»ΞΞΞΞΞΞΞβ€", "Σολομός"],
    ["ΞΒΞΞΞβ€ΞΒΞβ‚¬ΞΞΞβ€¦ΞΒ»ΞΞ", "Κοτόπουλο"],
    ["ΞΒΞΞΞβ€ΞΞΞβ‚¬ΞΞΞβ€¦ΞΒ»ΞΞ", "Κοτόπουλο"],
    ["Ξβ€ΞΒΞΒ½Ξβ€•", "Αρνί"],
    ["Ξβ€ΞΒΞΒ½ΞΞ‰", "Αρνί"],
    ["ΞΒΞΞΞΖ’Ξβ€΅ΞΒ¬ΞΒΞΞ‰", "Μοσχάρι"],
    ["ΞΒΞΞΞΖ’Ξβ€΅ΞΒ±ΞΒΞΞ‰", "Μοσχάρι"],
    ["ΞΒ¨ΞΒ¬ΞΒΞΞ‰ΞΒ± ΞΒ©ΞΞΞΒµΞΒ±ΞΒ½ΞΞΞΒ", "Ψάρια Ωκεανού"],
    ["ΞΒ¨ΞΒ¬ΞΒΞΞ‰", "Ψάρι"],
    ["ΞΞ…ΞΒΞΒ¶ΞΞ‰", "Ρύζι"],
    ["ΞΒ΅ΞΒΞΒ¶ΞΞ‰", "Ρύζι"],
    ["ΞΒΞΞΞβ€¦ΞΒ½ΞΒ­ΞΒ»ΞΞ‰", "Κουνέλι"],
    ["Ξβ€ΞΒ±ΞΒ»ΞΞΞβ‚¬ΞΞΞΒΞΒ»ΞΒ±", "Γαλοπούλα"],
    ["Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚", "Salmon"],
    ["ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ", "Chicken"],
    ["Ξ‘ΟΞ½Ξ―", "Lamb"],
    ["ΞΞΏΟƒΟ‡Ξ¬ΟΞΉ", "Beef"],
    ["Ξ¨Ξ¬ΟΞΉΞ± Ξ©ΞΊΞµΞ±Ξ½ΞΏΟ", "Ocean Fish"],
    ["Ξ¨Ξ¬ΟΞΉ", "Fish"],
    ["Ξ΅ΟΞ¶ΞΉ", "Rice"],
    ["ΞΞΏΟ…Ξ½Ξ­Ξ»ΞΉ", "Rabbit"],
    ["Ξ“Ξ±Ξ»ΞΏΟ€ΞΏΟΞ»Ξ±", "Turkey"],
  ];

  const normalized = replacements.reduce(
    (current, [brokenToken, readableToken]) =>
      current.split(brokenToken).join(readableToken),
    value
  );

  return replaceGeneratedGreekFoodTokenVariants(normalized);
}

const CUSTOMER_GREEK_FOOD_TOKENS = [
  ["Ψάρια Ωκεανού", "Ψάρια Ωκεανού"],
  ["Σολομός", "Σολομός"],
  ["Κοτόπουλο", "Κοτόπουλο"],
  ["Γαλοπούλα", "Γαλοπούλα"],
  ["Μοσχάρι", "Μοσχάρι"],
  ["Κουνέλι", "Κουνέλι"],
  ["Αρνί", "Αρνί"],
  ["Ψάρι", "Ψάρι"],
  ["Ρύζι", "Ρύζι"],
  ["Με ", "Με "],
] as const;

function utf8AsLatin1Mojibake(value: string) {
  return String.fromCharCode(...new TextEncoder().encode(value));
}

function utf8AsIsoGreekMojibake(value: string) {
  return new TextDecoder("iso-8859-7").decode(new TextEncoder().encode(value));
}

function generatedGreekFoodTokenVariants(value: string) {
  const variants = new Set<string>();
  const firstPassLatin = utf8AsLatin1Mojibake(value);
  const firstPassIsoGreek = utf8AsIsoGreekMojibake(value);

  variants.add(firstPassLatin);
  variants.add(firstPassIsoGreek);
  variants.add(utf8AsLatin1Mojibake(firstPassLatin));
  variants.add(utf8AsLatin1Mojibake(firstPassIsoGreek));
  variants.add(utf8AsIsoGreekMojibake(firstPassLatin));
  variants.add(utf8AsIsoGreekMojibake(firstPassIsoGreek));
  variants.delete(value);

  return [...variants].sort((left, right) => right.length - left.length);
}

function replaceGeneratedGreekFoodTokenVariants(value: string) {
  let current = value;

  for (const [readableToken, replacement] of CUSTOMER_GREEK_FOOD_TOKENS) {
    for (const brokenToken of generatedGreekFoodTokenVariants(readableToken)) {
      current = current.split(brokenToken).join(replacement);
    }
  }

  return current;
}

function polishReadableGreekFoodTokens(value: string) {
  return value
    .replace(/\u039e\u009e\u03b2\u20actm\u03be'\u00ae/gu, " ")
    .replace(/\u039e'\u00ae/gu, " ")
    .replace(
      /\u039e\u009a\u03be\u03ce\u03bf\u201e\u03bf\u008c\u03bf\u20ac\u03be\u03ce\u03bf\.{3}\u03bb\u03bf/gu,
      "\u039a\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf"
    )
    .replace(/\u03b5\u03cd\u03b6\u03b9/giu, "\u03a1\u03cd\u03b6\u03b9")
    .replace(/\s+/g, " ")
    .trim();
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
  return repairCustomerGreekMojibake(String(value ?? ""))
    .replace(/\u0392\u00ae/g, "\u00ae")
    .replace(/Ξ['’]?\u00ae/g, "\u00ae")
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

function removeLeadingLineAlias(brand: string, displayName: string) {
  const normalizedBrand = normalizeForCompare(brand);
  const lineAliases: Record<string, string[]> = {
    "monge bwild": ["bwild", "b wild"],
    orijen: ["acana"],
  };

  const aliases = lineAliases[normalizedBrand] ?? [];
  return aliases.reduce(
    (current, alias) =>
      current.replace(new RegExp(`^${escapeRegExp(alias)}\\s+`, "i"), ""),
    displayName
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

function titleCaseAllCapsCustomerName(displayName: string) {
  if (!/[A-Z]{3}/.test(displayName) || /[a-z]/.test(displayName)) {
    return displayName;
  }

  const preservedAcronyms = new Set(["DHA", "EPA", "GI", "NF", "OM", "UC"]);

  return displayName
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;

      return part
        .split("/")
        .map((slashPart) => {
          const match = slashPart.match(/^([^A-Z0-9]*)([A-Z0-9&+-]+)([^A-Z0-9]*)$/);
          if (!match) return slashPart;

          const [, leading, core, trailing] = match;
          if (preservedAcronyms.has(core) || /\d/.test(core)) return slashPart;
          if (core.includes("&")) {
            return `${leading}${core
              .split("&")
              .map((token) =>
                token ? `${token[0]}${token.slice(1).toLowerCase()}` : token
              )
              .join("&")}${trailing}`;
          }

          return `${leading}${core[0]}${core.slice(1).toLowerCase()}${trailing}`;
        })
        .join("/");
    })
    .join("");
}

export function customerFoodDisplayName(food: FoodNameInput) {
  const brand = cleanNamePart(food.brand);
  let displayName = cleanNamePart(food.display_name);
  if (!displayName) return "";

  displayName = repairPossessiveBrandTail(brand, displayName);
  displayName = removeLeadingLineAlias(brand, displayName);

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
      .replace(/\bDELICATE\b/g, "Delicate")
      .trim();
  }

  if (normalizedBrand === "happy dog") {
    displayName = displayName.replace(/^happy\s+/i, "").trim();
  }

  if (normalizedBrand.endsWith("vetsolution")) {
    displayName = displayName.replace(/^vetsolution\s+/i, "").trim();
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

  if (normalizedBrand.endsWith("vetsolution")) {
    displayName = displayName.replace(/^vetsolution\s+/i, "").trim();
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
  cleanedDisplayName = repairCustomerGreekMojibake(cleanedDisplayName);
  cleanedDisplayName = titleCaseAllCapsCustomerName(cleanedDisplayName);

  if (
    brand &&
    normalizeForCompare(cleanedDisplayName).startsWith(`${normalizedBrand} `)
  ) {
    cleanedDisplayName = cleanedDisplayName.slice(brand.length).trim();
  }

  const normalizedDisplayName = normalizeBrandlessFoodDisplayName({
      brand,
      display_name: cleanedDisplayName,
      formula_name: food.formula_name,
    });

  return (
    polishReadableGreekFoodTokens(
      repairCustomerGreekMojibake(normalizedDisplayName || cleanedDisplayName)
    ) || cleanedDisplayName
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
