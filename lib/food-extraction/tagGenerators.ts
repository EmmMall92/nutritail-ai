import {
  HEALTH_TAG_DICTIONARY,
  INGREDIENT_DICTIONARY,
  MEDICAL_TAG_DICTIONARY,
} from "@/lib/food-extraction/dictionaries";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function generateIngredientTags(text: string) {
  const normalized = normalizeText(text);
  const tags: string[] = [];

  for (const term of INGREDIENT_DICTIONARY.animal_proteins) {
    if (normalized.includes(normalizeText(term))) tags.push(term.replace(/\s+/g, "_"));
  }

  for (const term of INGREDIENT_DICTIONARY.carbohydrates) {
    if (normalized.includes(normalizeText(term))) tags.push(term.replace(/\s+/g, "_"));
  }

  if (hasAny(normalized, ["grain free", "χωρις σιτηρα", "χωρίς σιτηρά"])) {
    tags.push("grain_free");
  }

  if (hasAny(normalized, INGREDIENT_DICTIONARY.digestive_supports)) {
    tags.push("digestive_support");
  }

  if (hasAny(normalized, INGREDIENT_DICTIONARY.functional_supports)) {
    tags.push("functional_support");
  }

  return unique(tags);
}

export function generateHealthTags(text: string) {
  const normalized = normalizeText(text);
  return Object.entries(HEALTH_TAG_DICTIONARY)
    .filter(([, terms]) => hasAny(normalized, terms))
    .map(([tag]) => tag);
}

export function generateMedicalTags(text: string) {
  const normalized = normalizeText(text);
  return Object.entries(MEDICAL_TAG_DICTIONARY)
    .filter(([, terms]) => hasAny(normalized, terms))
    .map(([tag]) => tag);
}
