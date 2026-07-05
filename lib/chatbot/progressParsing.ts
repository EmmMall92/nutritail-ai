export type ProgressFollowUpField = "treats" | "appetite" | "stool" | "energy";

export type ProgressUpdateDetails = {
  currentWeightKg: number | null;
  feedingGramsPerDay: number | null;
  treatsNote: "none" | "few" | "some" | "many" | null;
  appetiteNote: "normal" | "hungry" | "low" | "picky" | null;
  stoolNote: "normal" | "better" | "soft" | "diarrhea" | "constipation" | null;
  energyNote: "normal" | "better" | "low" | "high" | null;
  bodyChangeNote: "leaner" | "same" | "heavier" | null;
  foodAcceptanceNote: "accepted" | "bored" | "refused" | null;
  missingFollowUpFields: ProgressFollowUpField[];
  hasEnoughProgressContext: boolean;
};

export function normalizeProgressText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseProgressUpdate(text: string): ProgressUpdateDetails {
  const normalized = normalizeProgressText(text);
  const currentWeightKg = readNumberBeforeUnit(
    normalized,
    /(?:kg|kgs|κιλ|κιλα|κιλο|κιλογραμμ\p{L}*|kilo|kilos)/u
  );
  const feedingGramsPerDay = readNumberBeforeUnit(
    normalized,
    /(?:g|gr|γρ\.?|γραμμαρι\p{L}*|gram|grams)/u
  );

  const treatsNote = detectTreatsNote(normalized);
  const appetiteNote = detectAppetiteNote(normalized);
  const stoolNote = detectStoolNote(normalized);
  const energyNote = detectEnergyNote(normalized);
  const bodyChangeNote = detectBodyChangeNote(normalized);
  const foodAcceptanceNote = detectFoodAcceptanceNote(normalized);
  const missingFollowUpFields: ProgressFollowUpField[] = [];

  if (!treatsNote) missingFollowUpFields.push("treats");
  if (!appetiteNote) missingFollowUpFields.push("appetite");
  if (!stoolNote) missingFollowUpFields.push("stool");
  if (!energyNote) missingFollowUpFields.push("energy");

  const contextNotes = [treatsNote, appetiteNote, stoolNote, energyNote].filter(
    Boolean
  ).length;

  return {
    currentWeightKg,
    feedingGramsPerDay,
    treatsNote,
    appetiteNote,
    stoolNote,
    energyNote,
    bodyChangeNote,
    foodAcceptanceNote,
    missingFollowUpFields,
    hasEnoughProgressContext:
      currentWeightKg !== null && feedingGramsPerDay !== null && contextNotes >= 2,
  };
}

function readNumberBeforeUnit(text: string, unitPattern: RegExp) {
  const match = text.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitPattern.source}(?![\\p{L}\\p{N}_])`, "u")
  );
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function detectTreatsNote(text: string): ProgressUpdateDetails["treatsNote"] {
  if (/(χωρις|καθολου|δεν παιρνει|no)\s+(λιχουδι|σνακ|snack|treat)/u.test(text)) {
    return "none";
  }
  if (/(λιγες|λιγα|1-2|μια|ελαχιστες|few)\s+(λιχουδι|σνακ|snack|treat)/u.test(text)) {
    return "few";
  }
  if (/(πολλες|πολλα|αρκετες|αρκετα|καθε μερα|many)\s+(λιχουδι|σνακ|snack|treat)/u.test(text)) {
    return "many";
  }
  if (/(λιχουδι|σνακ|snack|treat)/u.test(text)) return "some";
  return null;
}

function detectAppetiteNote(text: string): ProgressUpdateDetails["appetiteNote"] {
  if (/(καλη|φυσιολογικη|normal)\s+(ορεξη|appetite)/u.test(text)) return "normal";
  if (/(πειναει|ζητιανευει|πεινασμεν|hungry|begging)/u.test(text)) return "hungry";
  if (/(μειωμενη|χαμηλη|δεν τρωει πολυ|low)\s+(ορεξη|appetite)/u.test(text)) return "low";
  if (/(δυσκολ|επιλεκτικ|picky|fussy)/u.test(text)) return "picky";
  return null;
}

function detectStoolNote(text: string): ProgressUpdateDetails["stoolNote"] {
  if (/(καλυτερ\p{L}*)\s+(κοπρανα|κακα|stool)/u.test(text)) return "better";
  if (/(κανονικ\p{L}*|σφιχτ\p{L}*|normal)\s+(κοπρανα|κακα|stool)/u.test(text)) {
    return "normal";
  }
  if (/(μαλακ\p{L}*|soft)\s+(κοπρανα|κακα|stool)/u.test(text)) return "soft";
  if (/(διαρροια|diarrhea|diarrhoea)/u.test(text)) return "diarrhea";
  if (/(δυσκοιλιοτητα|constipation)/u.test(text)) return "constipation";
  return null;
}

function detectEnergyNote(text: string): ProgressUpdateDetails["energyNote"] {
  if (/(περισσοτερη|καλυτερη|more|better)\s+(ενεργεια|energy)/u.test(text)) {
    return "better";
  }
  if (/(κανονικη|φυσιολογικη|normal)\s+(ενεργεια|energy)/u.test(text)) {
    return "normal";
  }
  if (/(χαμηλη|λιγη|κουραζεται|low)\s+(ενεργεια|energy)/u.test(text)) return "low";
  if (/(πολλη|υψηλη|high)\s+(ενεργεια|energy)/u.test(text)) return "high";
  return null;
}

function detectBodyChangeNote(text: string): ProgressUpdateDetails["bodyChangeNote"] {
  if (/(αδυνατισ|πιο λεπ|leaner|slimmer)/u.test(text)) return "leaner";
  if (/(ιδιο σωμα|καμια αλλαγη|same body|unchanged)/u.test(text)) return "same";
  if (/(παχυνε|πιο βαρυ|heavier|gained)/u.test(text)) return "heavier";
  return null;
}

function detectFoodAcceptanceNote(
  text: string
): ProgressUpdateDetails["foodAcceptanceNote"] {
  if (
    /(βαρεθ|δεν του αρεσει πια|δεν της αρεσει πια|δεν τη θελει|δεν την θελει|δεν το θελει|δεν την τρωει|δεν τη τρωει|bored|does not want|doesnt want|refuses this food|stopped eating it)/u.test(
      text
    )
  ) {
    return /βαρεθ|bored/u.test(text) ? "bored" : "refused";
  }

  if (
    /(την τρωει καλα|τη τρωει καλα|την δεχτηκε|τη δεχτηκε|του αρεσει|της αρεσει|accepts|accepted|likes this food|eats it well)/u.test(
      text
    )
  ) {
    return "accepted";
  }

  return null;
}
