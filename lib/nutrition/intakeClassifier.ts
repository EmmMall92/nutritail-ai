export type IntakeClassification = {
  healthIssues: string[];
  allergies: string[];
};

const ALLERGY_MARKERS = [
  "allergy",
  "allergic",
  "intolerance",
  "sensitivity",
  "sensitive to",
  "αλλεργ",
  "δυσανεξ",
  "ευαισθ",
];

const ALLERGEN_ALIASES: Array<[string, string]> = [
  ["chicken", "chicken"],
  ["κοτοπου", "chicken"],
  ["beef", "beef"],
  ["μοσχα", "beef"],
  ["lamb", "lamb"],
  ["αρν", "lamb"],
  ["salmon", "salmon"],
  ["σολομ", "salmon"],
  ["fish", "fish"],
  ["ψαρ", "fish"],
  ["turkey", "turkey"],
  ["γαλοπου", "turkey"],
  ["pork", "pork"],
  ["χοιρ", "pork"],
  ["egg", "egg"],
  ["αυγ", "egg"],
  ["dairy", "dairy"],
  ["milk", "dairy"],
  ["γαλα", "dairy"],
  ["wheat", "wheat"],
  ["σιταρ", "wheat"],
  ["corn", "corn"],
  ["maize", "corn"],
  ["καλαμποκ", "corn"],
  ["soy", "soy"],
  ["soya", "soy"],
  ["σόγια", "soy"],
  ["σογια", "soy"],
  ["gluten", "gluten"],
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hasAllergyMarker(note: string) {
  return ALLERGY_MARKERS.some((marker) => note.includes(marker));
}

function detectAllergens(note: string) {
  return ALLERGEN_ALIASES.filter(([alias]) => note.includes(alias)).map(
    ([, canonical]) => canonical
  );
}

export function classifyIntakeNotes(notes: string[]): IntakeClassification {
  const healthIssues: string[] = [];
  const allergies: string[] = [];

  for (const rawNote of notes) {
    const note = rawNote.trim();
    const lowerNote = note.toLowerCase();

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
