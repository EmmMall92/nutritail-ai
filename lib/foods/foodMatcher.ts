export type FoodMatchRecord = Record<string, unknown> & {
  brand?: string | null;
  name?: string | null;
};

export type FoodMatchResult<TFood extends FoodMatchRecord> = {
  food: TFood;
  score: number;
};

export const MIN_FOOD_MATCH_SCORE = 20;

const GENERIC_QUERY_WORDS = new Set([
  "adult",
  "brand",
  "cat",
  "chicken",
  "dog",
  "dry",
  "food",
  "formula",
  "recipe",
  "wet",
]);

const QUERY_ALIASES: Array<[RegExp, string]> = [
  [/\brc\b/g, "royal canin"],
  [/\broyalcanin\b/g, "royal canin"],
  [/\bn\s*&\s*d\b/g, "n d"],
  [/\bnd\b/g, "n d"],
];

export function normalizeFoodSearchText(value: string) {
  let normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[+]/g, " plus ")
    .replace(/['’]/g, "");

  for (const [pattern, replacement] of QUERY_ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function getFoodSearchWords(query: string) {
  return normalizeFoodSearchText(query)
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length >= 3 && !GENERIC_QUERY_WORDS.has(word));
}

export function scoreFoodMatch(food: FoodMatchRecord, query: string) {
  const normalizedQuery = normalizeFoodSearchText(query);

  if (!normalizedQuery) return 0;

  const searchWords = getFoodSearchWords(normalizedQuery);
  const brand = normalizeFoodSearchText(String(food.brand ?? ""));
  const name = normalizeFoodSearchText(String(food.name ?? ""));
  const fullName = `${brand} ${name}`.trim();

  let score = 0;

  if (fullName.includes(normalizedQuery)) score += 100;
  if (normalizedQuery.includes(brand) && brand) score += 30;
  if (normalizedQuery.includes(name) && name) score += 50;

  for (const word of searchWords) {
    if (fullName.includes(word)) score += 10;
  }

  if (brand && normalizedQuery.startsWith(brand)) score += 10;
  if (name && normalizedQuery.endsWith(name)) score += 10;

  return score;
}

export function findFoodMatches<TFood extends FoodMatchRecord>(
  foods: TFood[],
  query: string,
  minimumScore = MIN_FOOD_MATCH_SCORE
): Array<FoodMatchResult<TFood>> {
  return foods
    .map((food) => ({
      food,
      score: scoreFoodMatch(food, query),
    }))
    .filter((item) => item.score >= minimumScore)
    .sort((a, b) => b.score - a.score);
}
