export type IntakeClassification = {
  healthIssues: string[];
  allergies: string[];
};

const ALLERGY_MARKERS = [
  "allergy",
  "allergic",
  "allerg",
  "intolerance",
  "intoler",
  "sensitivity",
  "sensitive to",
  "αλλεργ",
  "δυσανεξ",
  "ευαισθ",
  "dysanex",
  "evaisth",
];

const ALLERGEN_ALIASES: Array<[string, string]> = [
  ["chicken", "chicken"],
  ["κοτοπου", "chicken"],
  ["kotopoulo", "chicken"],
  ["beef", "beef"],
  ["μοσχα", "beef"],
  ["mosxari", "beef"],
  ["moshari", "beef"],
  ["lamb", "lamb"],
  ["αρν", "lamb"],
  ["arni", "lamb"],
  ["salmon", "salmon"],
  ["σολομ", "salmon"],
  ["solomos", "salmon"],
  ["fish", "fish"],
  ["ψαρ", "fish"],
  ["psari", "fish"],
  ["turkey", "turkey"],
  ["γαλοπου", "turkey"],
  ["galopoula", "turkey"],
  ["pork", "pork"],
  ["χοιρ", "pork"],
  ["xoirino", "pork"],
  ["hoirino", "pork"],
  ["egg", "egg"],
  ["αυγ", "egg"],
  ["avgo", "egg"],
  ["dairy", "dairy"],
  ["milk", "dairy"],
  ["γαλα", "dairy"],
  ["gala", "dairy"],
  ["wheat", "wheat"],
  ["σιταρ", "wheat"],
  ["sitari", "wheat"],
  ["corn", "corn"],
  ["maize", "corn"],
  ["καλαμποκ", "corn"],
  ["kalampoki", "corn"],
  ["soy", "soy"],
  ["soya", "soy"],
  ["σόγια", "soy"],
  ["σογια", "soy"],
  ["sogia", "soy"],
  ["gluten", "gluten"],
];

function normalizeIntakeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hasAllergyMarker(note: string) {
  return ALLERGY_MARKERS.some((marker) =>
    note.includes(normalizeIntakeText(marker))
  );
}

function detectAllergens(note: string) {
  return ALLERGEN_ALIASES.filter(([alias]) =>
    note.includes(normalizeIntakeText(alias))
  ).map(([, canonical]) => canonical);
}

export function classifyIntakeNotes(notes: string[]): IntakeClassification {
  const healthIssues: string[] = [];
  const allergies: string[] = [];

  for (const rawNote of notes) {
    const note = rawNote.trim();
    const lowerNote = normalizeIntakeText(note);

    if (!note) continue;

    const detectedAllergens = detectAllergens(lowerNote);
    const allergyLike = hasAllergyMarker(lowerNote);

    if (detectedAllergens.length > 0 && allergyLike) {
      allergies.push(...detectedAllergens);
      healthIssues.push(note);
      continue;
    }

    if (detectedAllergens.length > 0 && notes.length === 1) {
      allergies.push(...detectedAllergens);
      continue;
    }

    if (allergyLike) {
      healthIssues.push(note);
      continue;
    }

    healthIssues.push(note);
  }

  return {
    healthIssues: unique(healthIssues),
    allergies: unique(allergies),
  };
}
