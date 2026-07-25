export type StoreAssortmentFood = {
  id: string;
  brand: string;
  name: string;
};

export type StoreAssortmentEntry = {
  raw: string;
  brand: string;
  product: string | null;
};

export type StoreAssortmentEntryMatch = {
  entry: StoreAssortmentEntry;
  matchedFoodIds: string[];
  matchedFoodNames: string[];
  status: "matched" | "unmatched" | "ambiguous";
  suggestions: string[];
};

export type StoreAssortmentMatchResult = {
  entries: StoreAssortmentEntryMatch[];
  matchedFoodIds: string[];
  matchedFoods: StoreAssortmentFood[];
  unmatchedEntries: string[];
  ambiguousEntries: string[];
};

function foldLookupText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("el")
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBrandPrefix(name: string, brand: string) {
  const normalizedName = foldLookupText(name);
  const normalizedBrand = foldLookupText(brand);
  if (!normalizedBrand || !normalizedName.startsWith(`${normalizedBrand} `)) {
    return normalizedName;
  }
  return normalizedName.slice(normalizedBrand.length + 1).trim();
}

function parseDelimitedLine(line: string) {
  const pipeIndex = line.indexOf("|");
  if (pipeIndex >= 0) {
    return [line.slice(0, pipeIndex), line.slice(pipeIndex + 1)] as const;
  }

  const tabIndex = line.indexOf("\t");
  if (tabIndex >= 0) {
    return [line.slice(0, tabIndex), line.slice(tabIndex + 1)] as const;
  }

  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      return [
        line.slice(0, index).replace(/^"|"$/g, ""),
        line.slice(index + 1).replace(/^"|"$/g, ""),
      ] as const;
    }
  }

  return [line, ""] as const;
}

export function parseStoreAssortmentText(text: string) {
  const lines = text
    .replace(/^\uFEFF/u, "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));

  const entries: StoreAssortmentEntry[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const [rawBrand, rawProduct] = parseDelimitedLine(line);
    const brand = rawBrand.trim();
    const product = rawProduct.trim() || null;

    if (!brand) continue;
    if (
      foldLookupText(brand) === "brand" &&
      (!product || foldLookupText(product) === "product")
    ) {
      continue;
    }

    const key = `${foldLookupText(brand)}|${foldLookupText(product ?? "")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ raw: line, brand, product });
  }

  return entries;
}

function tokenOverlapScore(left: string, right: string) {
  const leftTokens = new Set(foldLookupText(left).split(" ").filter(Boolean));
  const rightTokens = new Set(foldLookupText(right).split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function suggestionsForEntry(
  entry: StoreAssortmentEntry,
  foods: StoreAssortmentFood[]
) {
  const sameBrandFoods = foods.filter(
    (food) => foldLookupText(food.brand) === foldLookupText(entry.brand)
  );
  const candidates = sameBrandFoods.length > 0 ? sameBrandFoods : foods;
  const searchText = entry.product
    ? `${entry.brand} ${entry.product}`
    : entry.brand;

  return candidates
    .map((food) => ({
      label: `${food.brand} | ${food.name}`,
      score: tokenOverlapScore(searchText, `${food.brand} ${food.name}`),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((candidate) => candidate.label);
}

export function matchStoreAssortment(
  text: string,
  foods: StoreAssortmentFood[]
): StoreAssortmentMatchResult {
  const entries = parseStoreAssortmentText(text);
  const matches: StoreAssortmentEntryMatch[] = entries.map((entry) => {
    const normalizedBrand = foldLookupText(entry.brand);
    const sameBrandFoods = foods.filter(
      (food) => foldLookupText(food.brand) === normalizedBrand
    );

    if (!entry.product) {
      return {
        entry,
        matchedFoodIds: sameBrandFoods.map((food) => food.id),
        matchedFoodNames: sameBrandFoods.map(
          (food) => `${food.brand} | ${food.name}`
        ),
        status: sameBrandFoods.length > 0 ? "matched" : "unmatched",
        suggestions:
          sameBrandFoods.length > 0 ? [] : suggestionsForEntry(entry, foods),
      };
    }

    const normalizedProduct = foldLookupText(entry.product);
    const exactFoods = sameBrandFoods.filter((food) => {
      const normalizedName = foldLookupText(food.name);
      const nameWithoutBrand = stripBrandPrefix(food.name, food.brand);
      const requestedWithoutBrand = stripBrandPrefix(
        entry.product ?? "",
        entry.brand
      );

      return (
        normalizedName === normalizedProduct ||
        nameWithoutBrand === normalizedProduct ||
        normalizedName === requestedWithoutBrand ||
        nameWithoutBrand === requestedWithoutBrand
      );
    });

    return {
      entry,
      matchedFoodIds: exactFoods.map((food) => food.id),
      matchedFoodNames: exactFoods.map(
        (food) => `${food.brand} | ${food.name}`
      ),
      status:
        exactFoods.length === 1
          ? "matched"
          : exactFoods.length > 1
            ? "ambiguous"
            : "unmatched",
      suggestions:
        exactFoods.length > 0 ? [] : suggestionsForEntry(entry, foods),
    };
  });

  const allowedIds = new Set(
    matches
      .filter((match) => match.status === "matched")
      .flatMap((match) => match.matchedFoodIds)
  );

  return {
    entries: matches,
    matchedFoodIds: [...allowedIds],
    matchedFoods: foods.filter((food) => allowedIds.has(food.id)),
    unmatchedEntries: matches
      .filter((match) => match.status === "unmatched")
      .map((match) => match.entry.raw),
    ambiguousEntries: matches
      .filter((match) => match.status === "ambiguous")
      .map((match) => match.entry.raw),
  };
}
