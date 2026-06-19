export type TastePreferences = {
  excludedIngredients: string[];
  preferredProteins: string[];
};

const PROTEIN_TERMS = [
  { keys: ["chicken", "κοτοπουλ"], value: "chicken" },
  { keys: ["lamb", "αρν"], value: "lamb" },
  { keys: ["salmon", "σολομ"], value: "salmon" },
  { keys: ["fish", "ψαρ"], value: "fish" },
  { keys: ["duck", "παπια", "πάπια"], value: "duck" },
  { keys: ["beef", "μοσχαρ", "βοδιν"], value: "beef" },
  { keys: ["pork", "χοιριν"], value: "pork" },
  { keys: ["turkey", "γαλοπουλ"], value: "turkey" },
  { keys: ["rabbit", "κουνελ"], value: "rabbit" },
  { keys: ["tuna", "τονο", "τόνο"], value: "tuna" },
  { keys: ["rice", "ρυζ"], value: "rice" },
  { keys: ["grain", "σιτηρ", "δημητριακ"], value: "grain" },
];

const NO_PREFERENCE_TERMS = [
  "no preference",
  "no preferences",
  "anything",
  "whatever",
  "δεν ξερω",
  "δεν ξέρω",
  "οτιδηποτε",
  "οτιδήποτε",
  "οχι",
  "όχι",
];

const AVOID_SIGNALS = [
  "avoid",
  "exclude",
  "allerg",
  "does not like",
  "doesnt like",
  "don't like",
  "dont like",
  "do not like",
  "not like",
  "does not eat",
  "doesnt eat",
  "don't eat",
  "dont eat",
  "do not eat",
  "no ",
  "without",
  "free from",
  "δεν τρω",
  "δεν τρώ",
  "δεν του αρε",
  "δεν της αρε",
  "δεν αρε",
  "δεν μπορει",
  "δεν μπορεί",
  "τον πειρα",
  "την πειρα",
  "αλλεργ",
];

const PREFER_SIGNALS = [
  "like",
  "prefer",
  "favorite",
  "αρεσει",
  "αρέσει",
  "προτιμ",
  "τρωει",
  "τρώει",
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTerms(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const key = normalizeText(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }

  return output;
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function splitPreferenceClauses(text: string) {
  return text
    .replace(/\s+και\s+(?=δεν\s+)/g, ". ")
    .replace(/\s+and\s+(?=(does not|doesnt|dont|do not|no|not)\s+)/g, ". ")
    .split(/[.,;|\n]+|\s+αλλα\s+|\s+αλλά\s+|\s+but\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

export function removeExcludedFromPreferred(preferred: string[], excluded: string[]) {
  const excludedSet = new Set(excluded.map((value) => normalizeText(value)));
  return uniqueTerms(preferred).filter(
    (value) => !excludedSet.has(normalizeText(value))
  );
}

export function parseTastePreferences(text: string): TastePreferences {
  const normalized = normalizeText(text);
  const noPreference = NO_PREFERENCE_TERMS.some((term) => normalized === normalizeText(term));

  if (noPreference) {
    return { excludedIngredients: [], preferredProteins: [] };
  }

  const excluded: string[] = [];
  const preferred: string[] = [];
  const clauses = splitPreferenceClauses(normalized);

  for (const clause of clauses.length > 0 ? clauses : [normalized]) {
    const matched = PROTEIN_TERMS.filter((term) =>
      term.keys.some((key) => clause.includes(normalizeText(key)))
    ).map((term) => term.value);

    if (matched.length === 0) continue;

    if (includesAny(clause, AVOID_SIGNALS)) {
      excluded.push(...matched);
      continue;
    }

    if (includesAny(clause, PREFER_SIGNALS)) {
      preferred.push(...matched);
      continue;
    }

    preferred.push(...matched);
  }

  const excludedIngredients = uniqueTerms(excluded);

  return {
    excludedIngredients,
    preferredProteins: removeExcludedFromPreferred(uniqueTerms(preferred), excludedIngredients),
  };
}
