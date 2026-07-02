export type FoodFormatPreference = "dry" | "wet" | "mixed";

function normalizeFormatText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectFoodFormatPreference(text: string): FoodFormatPreference | null {
  const value = normalizeFormatText(text);
  if (!value) return null;

  const wetSignals =
    /\b(wet|canned|can|tin|pouch|topper|gravy|sauce)\b|υγρ|κονσερβ|φακελακ|πατε|σάλτσ|σαλτσ/u;
  const drySignals = /\b(dry|kibble|croquette|croquettes)\b|ξηρ|κροκετ/u;
  const dryRefusal =
    /(αρνειται|δεν τρωει|δεν θελει|δεν δεχεται|refuse|refuses|refusing|rejects|does not eat|doesnt eat).{0,50}(ξηρ|κροκετ|dry|kibble|croquette)/u;
  const wetOnly =
    /(μονο|αποκλειστικα|only).{0,40}(υγρ|κονσερβ|φακελακ|wet|canned|pouch)/u;
  const dryOnly =
    /(μονο|αποκλειστικα|only).{0,40}(ξηρ|κροκετ|dry|kibble|croquette)/u;
  const mixedSignals =
    /(ξηρ|dry|kibble|κροκετ).{0,80}(υγρ|κονσερβ|wet|canned|topper|gravy|sauce)|(?:υγρ|κονσερβ|wet|topper).{0,80}(ξηρ|dry|kibble|κροκετ)|βαλ(?:ω|εις|ει).{0,40}(υγρ|κονσερβ|wet|topper)/u;

  const hasMixedSignal = mixedSignals.test(value);
  const hasDryRefusal = dryRefusal.test(value);
  const hasWetOnly = wetOnly.test(value);
  const hasDryOnly = dryOnly.test(value);
  const hasWetSignal = wetSignals.test(value);
  const hasDrySignal = drySignals.test(value);

  if (hasMixedSignal) return "mixed";
  if (hasDryRefusal || hasWetOnly) return "wet";
  if (hasDryOnly) return "dry";
  if (hasWetSignal && hasDrySignal) return "mixed";
  if (hasWetSignal) return "wet";
  if (hasDrySignal) return "dry";

  return null;
}

export function recommendationFormatFromPreference(
  preference: FoodFormatPreference | null | undefined
) {
  return preference === "wet" ? "wet" : "dry";
}
