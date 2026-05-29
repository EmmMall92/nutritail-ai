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
  "shop",
  "store",
  "wet",
  "zooplus",
]);

const QUERY_ALIASES: Array<[RegExp, string]> = [
  [/\brc\b/g, "royal canin"],
  [/\bρογιαλ\s+κανιν\b/g, "royal canin"],
  [/\broyal\s+canine\b/g, "royal canin"],
  [/\broyal\s+kanin\b/g, "royal canin"],
  [/\broial\s+(canin|kanin)\b/g, "royal canin"],
  [/\broyalcanin\b/g, "royal canin"],
  [/\broyal\s+mini\b/g, "royal canin mini"],
  [/\bjoserra\b/g, "josera"],
  [/\bjossera\b/g, "josera"],
  [/\bfarmina\s+nd\b/g, "farmina n d"],
  [/\bproplan\b/g, "pro plan"],
  [/\bpro\s*plan\b/g, "pro plan"],
  [/\bn\s*&\s*d\b/g, "n d"],
  [/\bn\s+and\s+d\b/g, "n d"],
  [/\bn-d\b/g, "n d"],
  [/\bnd\b/g, "n d"],
  [/\bmini\b/g, "small mini"],
  [/\bmaxi\b/g, "large maxi"],
  [/\bjunior\b/g, "puppy junior"],
  [/\bpup\b/g, "puppy"],
];

export function normalizeFoodSearchText(value: string) {
  let normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[+]/g, " plus ")
    .replace(/[-_/]/g, " ")
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

function getEditDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function getWordScore(queryWord: string, foodWords: string[]) {
  if (foodWords.includes(queryWord)) return 12;
  if (foodWords.some((word) => word.includes(queryWord))) return 10;
  if (foodWords.some((word) => queryWord.includes(word) && word.length >= 4)) {
    return 8;
  }

  const closeWord = foodWords.find((word) => {
    if (Math.min(word.length, queryWord.length) < 5) return false;
    const distance = getEditDistance(word, queryWord);
    return distance <= (Math.max(word.length, queryWord.length) >= 8 ? 2 : 1);
  });

  return closeWord ? 6 : 0;
}

export function scoreFoodMatch(food: FoodMatchRecord, query: string) {
  const normalizedQuery = normalizeFoodSearchText(query);

  if (!normalizedQuery) return 0;

  const searchWords = getFoodSearchWords(normalizedQuery);
  const brand = normalizeFoodSearchText(String(food.brand ?? ""));
  const name = normalizeFoodSearchText(String(food.name ?? ""));
  const fullName = `${brand} ${name}`.trim();
  const foodWords = getFoodSearchWords(fullName);

  let score = 0;

  if (fullName.includes(normalizedQuery)) score += 100;
  if (normalizedQuery.includes(brand) && brand) score += 30;
  if (normalizedQuery.includes(name) && name) score += 50;

  for (const word of searchWords) {
    score += getWordScore(word, foodWords);
  }

  if (brand && normalizedQuery.startsWith(brand)) score += 10;
  if (name && normalizedQuery.endsWith(name)) score += 10;
  if (searchWords.length > 0 && searchWords.every((word) => fullName.includes(word))) {
    score += 12;
  }

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
