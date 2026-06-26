import type {
  DogSize,
  FoodFormat,
  FoodProductV2,
  LifeStage,
  Species,
} from "@/types/food-v2";

const PACK_SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:g|gr|gram|grams|kg|kgs|kilogram|kilograms|lb|lbs)\b/gi;

const MULTIPACK_SIZE_PATTERN =
  /\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|kg|gr|gram|grams|kilogram|kilograms|lb|lbs)\b/gi;

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
  "doro",
  "dwro",
  "gift",
];

const DESCRIPTIVE_TITLE_PATTERNS = [
  /\bcomplete\s+food\s+for\b/i,
  /\bcomplete\s+dry\s+food\s+for\b/i,
  /\bcomplete\s+for\s+(?:adult|puppy|kitten|senior|sterilised|sensitive)\b/i,
  /\bcomplete\s+for\s+(?:adult\s+)?(?:dogs?|cats?|puppies|kittens)\b/i,
  /\bholistic\s+food\s+for\b/i,
  /\bdry\s+food\s+for\s+(?:adult\s+)?(?:dogs?|cats?|puppies|kittens)\b/i,
  /\bideal\s+for\b/i,
  /\bfood\s+for\s+(?:adult|puppy|kitten|senior|sterilised|sensitive)\b/i,
  /\u03c4\u03c1\u03bf\u03c6[\u03b7\u03ae]\s+\u03b3\u03b9\u03b1/iu,
  /\u03b9\u03b4\u03b1\u03bd\u03b9\u03ba[\u03b7\u03ae]\s+\u03b3\u03b9\u03b1/iu,
  /\u03bf\u03bb\u03b9\u03c3\u03c4\u03b9\u03ba[\u03b7\u03ae]\s+\u03c4\u03c1\u03bf\u03c6[\u03b7\u03ae]/iu,
  /\u03c0\u03bb[\u03b7\u03ae]\u03c1\u03b7[\u03c2\u03c3]\s+\u03c4\u03c1\u03bf\u03c6[\u03b7\u03ae]/iu,
  /τροφ[ηή]\s+για/iu,
  /ιδανικ[ηή]\s+για/iu,
  /ολιστικ[ηή]\s+τροφ[ηή]/iu,
  /πλ[ηή]ρη[ςσ]\s+τροφ[ηή]/iu,
];

const DESCRIPTIVE_PROTEIN_TOKENS: Array<[string, RegExp]> = [
  ["Chicken", /\bchicken\b|\u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb/iu],
  ["Turkey", /\bturkey\b|\u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03c5\u03bb/iu],
  ["Duck", /\bduck\b|\u03c0\u03b1\u03c0\u03b9\u03b1/iu],
  ["Lamb", /\blamb\b|\u03b1\u03c1\u03bd\u03b9/iu],
  ["Beef", /\bbeef\b|\u03bc\u03bf\u03c3\u03c7\u03b1\u03c1|\u03b2\u03bf\u03b4\u03b9\u03bd/iu],
  ["Pork", /\bpork\b|\u03c7\u03bf\u03b9\u03c1\u03b9\u03bd/iu],
  ["Rabbit", /\brabbit\b|\u03ba\u03bf\u03c5\u03bd\u03b5\u03bb/iu],
  ["Salmon", /\bsalmon\b|\u03c3\u03bf\u03bb\u03bf\u03bc/iu],
  ["Sardine", /\bsardine\b|\u03c3\u03b1\u03c1\u03b4\u03b5\u03bb/iu],
  ["Herring", /\bherring\b|\u03c1\u03b5\u03b3\u03b3/iu],
  ["Tuna", /\btuna\b|\u03c4\u03bf\u03bd\u03bf/iu],
  ["Fish", /\bfish\b|\u03c8\u03b1\u03c1/iu],
  ["Rice", /\brice\b|\u03c1\u03c5\u03b6/iu],
  ["Vegetables", /\bvegetables?\b|\u03bb\u03b1\u03c7\u03b1\u03bd/iu],
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

function applyKnownGreekTokenRepairs(value: string) {
  return value
    .replace(/Ξ’Β®/g, "Β®")
    .replace(/ΞΒ£ΞΞΞΒ»ΞΞΞΞΞΒΞβ€/g, "Salmon")
    .replace(/ΞΒΞΞΞβ€ΞΒΞβ‚¬ΞΞΞβ€¦ΞΒ»ΞΞ/g, "Chicken")
    .replace(/ΞΒ\S*ΞΎΒ»ΞΎΟ/gi, "Chicken")
    .replace(/Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚/g, "Σολομός")
    .replace(/Ξ£ΞΏΞ»ΞΏΞΌΞΏΟ‚/g, "Σολομός")
    .replace(/ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ/g, "Κοτόπουλο")
    .replace(/ΞΞΏΟ„ΞΏΟ€ΞΏΟ…Ξ»ΞΏ/g, "Κοτόπουλο")
    .replace(/Ξ‘ΟΞ½Ξ―/g, "Αρνί")
    .replace(/Ξ‘ΟΞ½ΞΉ/g, "Αρνί")
    .replace(/ΞΞΏΟƒΟ‡Ξ¬ΟΞΉ/g, "Μοσχάρι")
    .replace(/ΞΞΏΟƒΟ‡Ξ±ΟΞΉ/g, "Μοσχάρι")
    .replace(/ΟΞ¬ΟΞΉ/g, "Ψάρι")
    .replace(/ΟΞ±ΟΞΉ/g, "Ψάρι");
}

function cleanText(value: unknown) {
  return applyKnownGreekTokenRepairs(String(value ?? ""))
    .normalize("NFKC")
    .replace(/Β®/g, "®")
    .replace(/Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚/g, "Salmon")
    .replace(/ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ/g, "Chicken")
    .replace(/Ξ\S*ξ»ξώ/gi, "Chicken")
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

function brandPrefixVariants(brand: string) {
  const variants = [brand];
  const normalizedBrand = normalizeSearchText(brand);

  if (normalizedBrand === "royal canin veterinary diet") {
    variants.push(
      "Royal Canin Veterinary Diet",
      "Royal Canin Veterinary",
      "Royal Canin Vet Diet",
      "Royal Canin"
    );
  }

  return [...new Set(variants.filter(Boolean))];
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

function hasDescriptiveTitlePattern(value: string) {
  return DESCRIPTIVE_TITLE_PATTERNS.some((pattern) => pattern.test(value));
}

function joinTitleParts(parts: string[]) {
  return [...new Set(parts.filter(Boolean))].join(" ").replace(/\s+/g, " ").trim();
}

function simplifyDescriptiveFoodTitle(value: string) {
  if (!hasDescriptiveTitlePattern(value)) return "";

  const normalized = normalizeSearchText(value);
  const parts: string[] = [];
  const flavours: string[] = [];

  if (/\bgrain\s+free\b|\u03c7\u03c9\u03c1\u03b9\u03c2\s+\u03c3\u03b9\u03c4\u03b7\u03c1/iu.test(normalized)) {
    parts.push("Grain Free");
  } else if (/\blow\s+grain\b|\u03c7\u03b1\u03bc\u03b7\u03bb.*\u03c3\u03b9\u03c4\u03b7\u03c1/iu.test(normalized)) {
    parts.push("Low Grain");
  }

  if (/\ball\s+breeds\b|\u03bf\u03bb\u03c9\u03bd\s+\u03c4\u03c9\u03bd\s+\u03c6\u03c5\u03bb/iu.test(normalized)) {
    parts.push("All Breeds");
  } else if (/\bmini\b|\bsmall\b|\u03bc\u03b9\u03ba\u03c1\u03bf\u03c3\u03c9\u03bc/iu.test(normalized)) {
    parts.push("Small");
  } else if (/\bmedium\b|\u03bc\u03b5\u03c3\u03b1\u03b9/iu.test(normalized)) {
    parts.push("Medium");
  } else if (/\blarge\b|\bmaxi\b|\u03bc\u03b5\u03b3\u03b1\u03bb\u03bf\u03c3\u03c9\u03bc/iu.test(normalized)) {
    parts.push("Large");
  }

  if (/\bpuppy\b|\u03ba\u03bf\u03c5\u03c4\u03b1\u03b2/iu.test(normalized)) {
    parts.push("Puppy");
  } else if (/\bkitten\b|\u03b3\u03b1\u03c4\u03b1\u03ba/iu.test(normalized)) {
    parts.push("Kitten");
  } else if (/\bsenior\b|\bmature\b|\u03b7\u03bb\u03b9\u03ba\u03b9\u03c9\u03bc/iu.test(normalized)) {
    parts.push("Senior");
  } else if (/\badult\b|\u03b5\u03bd\u03b7\u03bb\u03b9\u03ba/iu.test(normalized)) {
    parts.push("Adult");
  }

  for (const [label, pattern] of DESCRIPTIVE_PROTEIN_TOKENS) {
    if (pattern.test(normalized)) flavours.push(label);
  }

  const simplified = joinTitleParts([
    ...parts,
    [...new Set(flavours)].join(" & "),
  ]);
  return simplified && simplified !== value ? simplified : "";
}

function dedupeRepeatedDisplayTerms(value: string) {
  return value
    .replace(/\b(active nature|sensi plus)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(happy)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(vetsolution)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(veterinary)(?:\s+\1)+\b/gi, "$1")
    .replace(
      /\b(urinary|renal|senior|puppy|kitten|junior|adult|mature|maintenance|mini|small|medium|large|giant|maxi|xsmall|light|sterilised|sterilized|neutered|sensitive|digestive)(?:\s+\1)+\b/gi,
      "$1"
    )
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeRepeatedLeadingToken(value: string) {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return value;

  const first = normalizeSearchText(tokens[0]);
  const second = normalizeSearchText(tokens[1]);
  if (!first || first !== second) return value;

  return tokens.slice(1).join(" ");
}

function removeFeedingTableTitleTail(value: string) {
  return value
    .replace(/\b(?:weight\s+)?activity\s*\/?\s*day\b[\s\S]*$/i, " ")
    .replace(/\bfeeding\s+(?:amount|guide|recommendation|table)\b[\s\S]*$/i, " ")
    .replace(/\b(?:daily\s+)?ration\b[\s\S]*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeLabelPanelTitleTail(value: string) {
  return value
    .replace(/\b(?:analytical\s+constituents?|guaranteed\s+analysis)\b[\s\S]*$/i, " ")
    .replace(/\b(?:composition|ingredients?|additives?)\s*[:\-]\s*[\s\S]*$/i, " ")
    .replace(
      /\b(?:protein|fat\s+content|crude\s+fat|crude\s+fibre|crude\s+fiber|crude\s+ash|moisture)\s+\d/i,
      " "
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

function removePackAndPromoText(value: string) {
  return value
    .replace(MULTIPACK_SIZE_PATTERN, " ")
    .replace(/\+\s*\d+(?:[.,]\d+)?\s*(?:g|gr|kg)\b/gi, " ")
    .replace(PACK_SIZE_PATTERN, " ")
    .replace(/\b\d+\s*x\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:\+?\s*free|pack|bags?)\b/gi, " ")
    .replace(/(?:\u03b4\u03c9\u03c1\u03bf|\u03b4\u03ce\u03c1\u03bf|\u0394\u03a9\u03a1\u039f|\u0394\u03c9\u03c1\u03bf)/gu, " ")
    .replace(/\b(?:δωρο|δώρο|ΔΩΡΟ|doro|dwro|gift|free\s+pack|try\s+now)\b/gi, " ")
    .replace(/\s*[-!]\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCanonicalFormulaName(value: unknown) {
  return titleCase(
    removePackAndPromoText(
      removeLabelPanelTitleTail(
        removeFeedingTableTitleTail(
          dedupeRepeatedDisplayTerms(removeNoiseWords(cleanText(value)))
        )
      )
    )
      .replace(MULTIPACK_SIZE_PATTERN, " ")
      .replace(PACK_SIZE_PATTERN, " ")
      .replace(/\b\d+\s*x\b/gi, " ")
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:\+?\s*free|pack|bags?)\b/gi, " ")
      .replace(/\+\s*\d+(?:[.,]\d+)?\s*(?:g|gr|kg)\b/gi, " ")
      .replace(/\b(?:δωρο|δώρο|doro|dwro|gift|free\s+pack|try\s+now)\b/gi, " ")
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

  let normalizedDisplay = normalizeSearchText(cleanedDisplay);
  const brandPrefixes = brandPrefixVariants(cleanedBrand);
  let changed = true;

  while (changed) {
    changed = false;
    for (const prefix of brandPrefixes) {
      const normalizedPrefix = normalizeSearchText(prefix);
      if (
        normalizedPrefix &&
        (normalizedDisplay === normalizedPrefix ||
          normalizedDisplay.startsWith(`${normalizedPrefix} `))
      ) {
        cleanedDisplay = cleanedDisplay.slice(prefix.length).trim();
        normalizedDisplay = normalizeSearchText(cleanedDisplay);
        changed = true;
        break;
      }
    }
    normalizedDisplay = normalizeSearchText(cleanedDisplay);
  }

  const displayWithoutBrand = dedupeRepeatedDisplayTerms(
    dedupeRepeatedLeadingToken(cleanedDisplay)
  )
    .replace(/\s+/g, " ")
    .trim();

  return simplifyDescriptiveFoodTitle(displayWithoutBrand) || displayWithoutBrand;
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

export function isLikelyDescriptiveFoodTitle({
  brand,
  display_name,
  formula_name,
}: {
  brand: string;
  display_name?: string | null;
  formula_name?: string | null;
}) {
  const rawTitle = [display_name, formula_name]
    .map((value) => cleanText(value))
    .filter(Boolean)
    .join(" ");

  if (rawTitle && hasDescriptiveTitlePattern(rawTitle)) return true;

  const title = normalizeBrandlessFoodDisplayName({
    brand,
    display_name,
    formula_name,
  });

  if (!title) return false;

  return DESCRIPTIVE_TITLE_PATTERNS.some((pattern) => pattern.test(title));
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
