type FoodNameInput = {
  brand?: string | null;
  display_name?: string | null;
};

function cleanNamePart(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
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

export function customerFoodDisplayName(food: FoodNameInput) {
  const brand = cleanNamePart(food.brand);
  let displayName = cleanNamePart(food.display_name);
  if (!displayName) return "";

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

  const firstBrandWord = brand.split(/\s+/)[0];
  if (firstBrandWord) {
    displayName = displayName.replace(
      new RegExp(`^${escapeRegExp(firstBrandWord)}\\s+${escapeRegExp(firstBrandWord)}\\s+`, "i"),
      `${firstBrandWord} `
    );
  }

  return collapseRepeatedCustomerTokens(displayName)
    .replace(/\b(happy)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(vetsolution)(?:\s+\1)+\b/gi, "$1")
    .replace(/\b(pro\s*plan)(?:\s+\1)+\b/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
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
