import type { ChatbotLocale, ChatbotPetContext } from "@/lib/chatbot/types";

export type ChatbotSafetyWarning = {
  code: string;
  severity: "hard_stop" | "warning" | "info";
  message: string;
};

type SafetyRule = {
  code: string;
  severity: "hard_stop" | "warning";
  patterns: RegExp[];
  message: Record<ChatbotLocale, string>;
};

function normalizeSafetyText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rx(pattern: string) {
  return new RegExp(pattern, "iu");
}

const greekPatterns = {
  catContext: rx("(γατ|γατο|γατα|γατος|γατουλα|γατακι|αρσενικος γατος|gat[ao]?s?|gata|gati|cat)"),
  noUrine: rx(
    "(δεν|δε).{0,20}(ουρησει|κατουρησει|κανει\\s*τσισα)|δεν\\s*βγαινουν\\s*(ουρα|τσισα)|προσπαθ.{0,35}(ουρησει|κατουρησει|κανει\\s*τσισα|ουρ|κατουρ|τσισ)|δυσκολ.{0,35}(ουρησει|κατουρησει|ουρ|κατουρ|τσισ)|\\bden\\b.{0,30}(mporei|borei|vgainei|vgazei|kanei).{0,35}(our|katour|tsis|pee)|prospath.{0,45}(our|katour|tsis|pee)|diskol.{0,45}(our|katour|tsis|pee)|αποφραξ|φραγμ|blocked|straining"
  ),
  blood: rx(
    "\\bαιμα\\b|αιματ\\w+|με\\s+αιμα|αιμα\\s+(στα|στα\\s+κοπρανα|στα\\s+ουρα)|κοπρανα\\s+με\\s+αιμα|ουρα\\s+με\\s+αιμα|\\baima\\b|oura\\s+me\\s+aima|koprana\\s+me\\s+aima|bloody|blood"
  ),
  persistentVomiting: rx(
    "(συνεχ|πολλ|επιμον|καθε|επαναλαμβαν).{0,45}εμετ|εμετ.{0,45}(συνεχ|πολλ|μερες|ωρες|φορες|persistent|repeated)|(synech|polla|epimon|kathe|epanalamvan).{0,45}emet|emet.{0,45}(synech|polla|meres|ores|fores|persistent|repeated)"
  ),
  notEatingUrgent: rx(
    "(δεν|δε)\\s+τρωει\\s+.{0,70}(καθολου|24|48|ωρ|ημερ|μερες|δυο\\s+μερες|2\\s+μερες)|\\bden\\b\\s+tr(o|w)ei\\s+.{0,70}(katholou|24|48|ores|imer|meres|dyo\\s+meres|2\\s+meres)|ανορεξ|χωρις\\s+ορεξη\\s+.{0,40}(24|48|ωρ|ημερ|μερες)|not\\s+eating\\s+(at\\s+all|for|24|48|\\d+\\s*(h|hr|hrs|hour|hours|day|days))"
  ),
  severePainOrCollapse: rx(
    "κατερρευ|καταρρευσ|collapse|collapsed|εντον\\w*\\s+.{0,25}πονο|ποναει\\s+πολυ|πονο\\w*\\s+.{0,25}κοιλι|διπλωνεται\\s+.{0,25}πονο|severe\\s+(abdominal\\s+)?pain"
  ),
  notDrinking: rx(
    "(δεν|δε)\\s+πινει\\s+.{0,35}(καθολου)|χωρις\\s+νερο|αφυδατ|not\\s+drinking(?!\\s+much)|dehydrat"
  ),
  lowWaterIntake: rx(
    "(δεν|δε)\\s+πινει\\s+.{0,35}(αρκετ|πολυ|νερο)|πινει\\s+λιγο\\s+νερο|low\\s+water\\s+intake|not\\s+drinking\\s+much"
  ),
  severeAllergy: rx(
    "πρηξ\\w*\\s+.{0,30}(μουτρ|προσωπ)|δυσκολ\\w*\\s+.{0,30}αναπν|πνιγ|σοβαρ\\w*\\s+.{0,30}αλλεργ|swollen\\s+face|difficulty\\s+breathing|severe\\s+allerg"
  ),
  renal: rx("νεφρ|ουρια|κρεατιν|ckd|iris|kidney|renal"),
  pancreatitis: rx("παγκρεατ|pancreatitis"),
  diabetes: rx("διαβητ|diabetes|diabetic"),
};

const SAFETY_RULES: SafetyRule[] = [
  {
    code: "male_cat_no_urine",
    severity: "hard_stop",
    patterns: [
      /male\s+cat.*(no\s+urine|can't\s+pee|cannot\s+pee|straining|blocked)/iu,
      /cat.*(cannot\s+urinate|can't\s+urinate|blocked|urinary\s+blockage|no\s+urine)/iu,
      rx("(αρσενικ|γατος|γατα|γατ).{0,120}(δεν|δε|προσπαθ|δυσκολ|αποφραξ|φραγμ).{0,80}(ουρ|κατουρ|τσισ|blocked|straining)"),
      rx("(gatos|gata|gati|cat).{0,120}(den|de|prospath|diskol|blocked|straining).{0,80}(our|katour|tsis|pee|urine)"),
    ],
    message: {
      el: "Αν γάτα, ειδικά αρσενικός γάτος, ζορίζεται ή δεν μπορεί να ουρήσει, αυτό μπορεί να είναι επείγον. Μην περιμένεις αλλαγή τροφής. Επικοινώνησε άμεσα με κτηνίατρο ή εφημερεύουσα κλινική.",
      en: "If a cat, especially a male cat, is straining or cannot urinate, this can be an emergency. Do not wait on a food change. Contact a veterinarian or emergency clinic now.",
    },
  },
  {
    code: "blood_seen",
    severity: "hard_stop",
    patterns: [/blood/iu, greekPatterns.blood],
    message: {
      el: "Αίμα σε ούρα, διάρροια ή κόπρανα χρειάζεται κτηνιατρικό έλεγχο πριν μιλήσουμε για αλλαγή τροφής.",
      en: "Blood in urine, diarrhea, or stool needs veterinary assessment before food changes.",
    },
  },
  {
    code: "persistent_vomiting",
    severity: "hard_stop",
    patterns: [
      /persistent\s+vomit/iu,
      /repeated\s+vomit/iu,
      /vomiting\s+for/iu,
      greekPatterns.persistentVomiting,
    ],
    message: {
      el: "Συνεχείς ή επαναλαμβανόμενοι εμετοί δεν πρέπει να αντιμετωπίζονται μόνο με τροφή. Μίλα με κτηνίατρο πριν κάνεις διατροφική αλλαγή.",
      en: "Persistent vomiting should not be managed by diet alone. Speak with a veterinarian before changing food.",
    },
  },
  {
    code: "not_eating",
    severity: "hard_stop",
    patterns: [
      /not\s+eating(?:\s*$|\s+(?:at\s+all|anything|for|\d+\s*(?:h|hr|hrs|hour|hours|day|days)))/iu,
      /won't\s+eat/iu,
      /no\s+appetite/iu,
      greekPatterns.notEatingUrgent,
    ],
    message: {
      el: "Αν δεν τρώει, ειδικά αν είναι γάτα ή κρατάει πάνω από 24 ώρες, χρειάζεται γρήγορη κτηνιατρική καθοδήγηση πριν από οποιαδήποτε πρόταση τροφής.",
      en: "Not eating, especially in cats or for more than 24 hours, needs prompt veterinary guidance before food advice.",
    },
  },
  {
    code: "collapse_or_severe_pain",
    severity: "hard_stop",
    patterns: [
      /collapse/iu,
      /collapsed/iu,
      /severe\s+abdominal\s+pain/iu,
      /severe\s+pain/iu,
      greekPatterns.severePainOrCollapse,
    ],
    message: {
      el: "Κατάρρευση ή έντονος πόνος είναι επείγον σημάδι. Χρειάζεται άμεση κτηνιατρική εκτίμηση.",
      en: "Collapse or severe pain is an emergency sign. Seek veterinary care now.",
    },
  },
  {
    code: "not_drinking",
    severity: "hard_stop",
    patterns: [/not\s+drinking(?!\s+much)/iu, /no\s+water/iu, greekPatterns.notDrinking],
    message: {
      el: "Αν δεν πίνει καθόλου νερό ή δείχνει αφυδατωμένο, χρειάζεται κτηνιατρική εκτίμηση πριν από διατροφική σύσταση.",
      en: "If the pet is not drinking or seems dehydrated, veterinary assessment should come before food advice.",
    },
  },
  {
    code: "low_water_intake",
    severity: "warning",
    patterns: [greekPatterns.lowWaterIntake],
    message: {
      el: "Αν πίνει λιγότερο νερό από το συνηθισμένο, κράτα το υπό παρακολούθηση και μίλα με κτηνίατρο αν συνεχιστεί ή συνδυάζεται με αδιαθεσία. Η τροφή μπορεί να συζητηθεί, αλλά όχι σαν διάγνωση.",
      en: "If water intake is lower than usual, monitor it and speak with a veterinarian if it persists or comes with illness signs. Food can be discussed, but not as a diagnosis.",
    },
  },
  {
    code: "severe_allergy",
    severity: "hard_stop",
    patterns: [
      /swollen\s+face/iu,
      /difficulty\s+breathing/iu,
      /severe\s+allergy/iu,
      greekPatterns.severeAllergy,
    ],
    message: {
      el: "Πρήξιμο στο πρόσωπο ή δυσκολία στην αναπνοή μπορεί να είναι σοβαρή αλλεργική αντίδραση και χρειάζεται άμεση βοήθεια.",
      en: "Facial swelling or breathing difficulty can be a severe allergic reaction and needs urgent help.",
    },
  },
  {
    code: "renal",
    severity: "warning",
    patterns: [/renal/iu, /kidney/iu, /ckd/iu, greekPatterns.renal],
    message: {
      el: "Για νεφρικό περιστατικό, η τροφή πρέπει να επιλέγεται με κτηνίατρο και προσοχή σε φώσφορο, όρεξη, βάρος και στάδιο νόσου. Δεν θα το αντιμετωπίσω σαν απλή επιλογή τροφής.",
      en: "For renal disease, diet choice should be veterinarian-guided and phosphorus, appetite, weight, and disease stage aware. I should not treat this as a simple food-shopping question.",
    },
  },
  {
    code: "pancreatitis",
    severity: "warning",
    patterns: [/pancreatitis/iu, greekPatterns.pancreatitis],
    message: {
      el: "Η παγκρεατίτιδα χρειάζεται κτηνιατρική καθοδήγηση και προσεκτικό έλεγχο λιπαρών. Δεν προτείνουμε υψηλά λιπαρά σε τέτοιο ιστορικό.",
      en: "Pancreatitis needs veterinarian guidance and careful fat control. High-fat food should not be recommended for this history.",
    },
  },
  {
    code: "diabetes",
    severity: "warning",
    patterns: [/diabetes/iu, /diabetic/iu, greekPatterns.diabetes],
    message: {
      el: "Ο διαβήτης χρειάζεται πρόγραμμα με κτηνίατρο, σταθερότητα στη σίτιση και προσοχή στις αλλαγές τροφής. Δεν είναι απλή αλλαγή προϊόντος.",
      en: "Diabetes needs a veterinarian-guided plan, feeding consistency, and careful food changes. It is not a casual product switch.",
    },
  },
];

function textFrom(message: string, pet?: ChatbotPetContext | null) {
  return [
    message,
    pet?.species,
    pet?.vetDiagnosis,
    ...(pet?.healthIssues ?? []),
    ...(pet?.allergies ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectSafetyWarnings({
  message,
  pet,
  locale = "el",
}: {
  message: string;
  pet?: ChatbotPetContext | null;
  locale?: ChatbotLocale;
}): ChatbotSafetyWarning[] {
  const text = normalizeSafetyText(textFrom(message, pet));
  const warnings: ChatbotSafetyWarning[] = [];

  for (const rule of SAFETY_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(text));
    if (!matched) continue;

    if (rule.code === "male_cat_no_urine") {
      const catContext =
        greekPatterns.catContext.test(text) ||
        text.includes("cat") ||
        pet?.species === "cat";
      const noUrineContext = greekPatterns.noUrine.test(text);
      if (!catContext || !noUrineContext) continue;
    }

    warnings.push({
      code: rule.code,
      severity: rule.severity,
      message: rule.message[locale],
    });
  }

  if (warnings.length > 0) {
    warnings.push({
      code: "no_diagnosis_or_treatment",
      severity: "info",
      message:
        locale === "el"
          ? "Μπορώ να βοηθήσω με διατροφική καθοδήγηση, αλλά δεν κάνω διάγνωση ή θεραπεία."
          : "I can help with nutrition guidance, but I cannot diagnose or treat.",
    });
  }

  return dedupeWarnings(warnings);
}

function dedupeWarnings(warnings: ChatbotSafetyWarning[]) {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    if (seen.has(warning.code)) return false;
    seen.add(warning.code);
    return true;
  });
}

export function hasHardStop(warnings: ChatbotSafetyWarning[]) {
  return warnings.some((warning) => warning.severity === "hard_stop");
}

export function shouldInterruptForSafety(warnings: ChatbotSafetyWarning[]) {
  return warnings.some(
    (warning) => warning.severity === "hard_stop" || warning.severity === "warning"
  );
}

export function formatSafetyInterruptMessage(
  warnings: ChatbotSafetyWarning[],
  locale: ChatbotLocale = "el"
) {
  const hardStops = warnings.filter((warning) => warning.severity === "hard_stop");
  const visibleWarnings = hardStops.length > 0 ? hardStops : warnings.filter((warning) => warning.severity === "warning");
  const hasEmergency = hardStops.length > 0;
  const intro =
    locale === "el"
      ? hasEmergency
        ? "Πριν μιλήσουμε για τροφή, αυτό χρειάζεται άμεση προσοχή:"
        : "Πριν συνεχίσουμε σαν απλή επιλογή τροφής, κράτα αυτό:"
      : hasEmergency
        ? "Before we talk about food, this needs immediate attention:"
        : "Before we continue as a simple food-shopping flow, keep this in mind:";
  const outro =
    locale === "el"
      ? hasEmergency
        ? "Δεν θα σου εμφανίσω προτάσεις τροφών για αυτό το μήνυμα, γιατί πρώτα πρέπει να αποκλειστεί επείγον περιστατικό."
        : "Μπορούμε να συνεχίσουμε με διατροφική καθοδήγηση, αλλά μόνο προσεκτικά και χωρίς να το παρουσιάσουμε ως θεραπεία."
      : hasEmergency
        ? "I will not show food recommendations for this message because an urgent issue should be ruled out first."
        : "We can continue with nutrition guidance, but only cautiously and without presenting it as treatment.";

  return [
    intro,
    "",
    ...visibleWarnings.map((warning) => `- ${warning.message}`),
    "",
    outro,
  ].join("\n");
}
