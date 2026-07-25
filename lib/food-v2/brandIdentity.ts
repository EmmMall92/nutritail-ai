const CANONICAL_BRAND_BY_KEY: Record<string, string> = {
  acana: "ACANA",
  orijen: "ORIJEN",
  "royal canine": "Royal Canin",
  "royal canin": "Royal Canin",
};

export function canonicalFoodBrand(value: unknown) {
  const cleaned = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return CANONICAL_BRAND_BY_KEY[cleaned.toLocaleLowerCase("en")] ?? cleaned;
}

export function sameCanonicalFoodBrand(left: unknown, right: unknown) {
  return (
    canonicalFoodBrand(left).toLocaleLowerCase("en") ===
    canonicalFoodBrand(right).toLocaleLowerCase("en")
  );
}
