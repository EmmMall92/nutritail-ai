export type TastePreferences = {
  excludedIngredients: string[];
  preferredProteins: string[];
};

const PROTEIN_TERMS = [
  { keys: ["chicken", "kotopoulo", "κοτοπουλ"], value: "chicken" },
  { keys: ["lamb", "arni", "αρν"], value: "lamb" },
  { keys: ["salmon", "solomos", "σολομ"], value: "salmon" },
  { keys: ["fish", "psari", "ψαρ"], value: "fish" },
  { keys: ["duck", "papia", "παπια"], value: "duck" },
  { keys: ["beef", "mosxari", "moschari", "vodino", "μοσχαρ", "βοδιν"], value: "beef" },
  { keys: ["pork", "xoirino", "choirino", "χοιριν"], value: "pork" },
  { keys: ["turkey", "galopoula", "γαλοπουλ"], value: "turkey" },
  { keys: ["rabbit", "kouneli", "κουνελ"], value: "rabbit" },
  { keys: ["tuna", "tonos", "τονο", "τονo"], value: "tuna" },
  { keys: ["rice", "ryzi", "rizi", "ρυζ"], value: "rice" },
  { keys: ["grain", "sitira", "σιτηρ", "δημητριακ"], value: "grain" },
  { keys: ["wheat", "sitar", "σιταρ"], value: "wheat" },
  { keys: ["corn", "maize", "kalampoki", "καλαμποκ"], value: "corn" },
  { keys: ["dairy", "milk", "cheese", "galakt", "gala", "γαλακτ", "γαλα"], value: "dairy" },
  { keys: ["legume", "pea", "lentil", "ospr", "arakas", "faki", "οσπρ", "αρακα", "φακ"], value: "legumes" },
];

const NO_PREFERENCE_TERMS = [
  "no preference",
  "no preferences",
  "anything",
  "whatever",
  "dont know",
  "don't know",
  "den ksero",
  "den xero",
  "δεν ξερω",
  "οτιδηποτε",
  "οχι",
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
  "den troei",
  "den troi",
  "den tou aresei",
  "den ths aresei",
  "den tis aresei",
  "den aresei",
  "den mpor",
  "ton peira",
  "tin peira",
  "allerg",
  "δεν τρω",
  "δεν του αρε",
  "δεν της αρε",
  "δεν τησ αρε",
  "δεν αρε",
  "δεν μπορ",
  "τον πειρα",
  "την πειρα",
  "τησ πειρα",
  "αλλεργ",
];

const PREFER_SIGNALS = [
  "like",
  "likes",
  "prefer",
  "prefers",
  "favorite",
  "favourite",
  "tou aresei",
  "tis aresei",
  "ths aresei",
  "aresei",
  "protima",
  "troei",
  "troi",
  "αρεσει",
  "προτιμ",
  "τρωει",
  "τρωει ευκολα",
  "λατρευ",
];

export function normalizeTasteText(value: string) {
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
    const key = normalizeTasteText(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }

  return output;
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeTasteText(term)));
}

function splitPreferenceClauses(text: string) {
  return text
    .replace(/\s+και\s+(?=(δεν|δε)\s+)/g, ". ")
    .replace(/\s+kai\s+(?=den\s+)/g, ". ")
    .replace(/\s+and\s+(?=(does not|doesnt|dont|do not|no|not)\s+)/g, ". ")
    .split(/[.,;|\n]+|\s+αλλα\s+|\s+αλλά\s+|\s+alla\s+|\s+but\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

export function removeExcludedFromPreferred(preferred: string[], excluded: string[]) {
  const excludedSet = new Set(excluded.map((value) => normalizeTasteText(value)));
  return uniqueTerms(preferred).filter(
    (value) => !excludedSet.has(normalizeTasteText(value))
  );
}

export function parseTastePreferences(text: string): TastePreferences {
  const normalized = normalizeTasteText(text);
  const noPreference = NO_PREFERENCE_TERMS.some(
    (term) => normalized === normalizeTasteText(term)
  );

  if (noPreference) {
    return { excludedIngredients: [], preferredProteins: [] };
  }

  const excluded: string[] = [];
  const preferred: string[] = [];
  const clauses = splitPreferenceClauses(normalized);

  for (const clause of clauses.length > 0 ? clauses : [normalized]) {
    const matched = PROTEIN_TERMS.filter((term) =>
      term.keys.some((key) => clause.includes(normalizeTasteText(key)))
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
