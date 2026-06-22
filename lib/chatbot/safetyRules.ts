import type { ChatbotLocale, ChatbotPetContext } from "@/lib/chatbot/types";

export type ChatbotSafetyWarning = {
  code: string;
  severity: "hard_stop" | "warning" | "info";
  message: string;
};

type SafetyRule = {
  code: string;
  patterns: RegExp[];
  message: Record<ChatbotLocale, string>;
};

const greek = {
  maleCatUrinaryBlock:
    /(?:\u03b3\u03b1\u03c4\u03bf\u03c2|\u03b3\u03ac\u03c4\u03bf\u03c2|\u03b1\u03c1\u03c3\u03b5\u03bd\u03b9\u03ba)[\s\S]{0,80}(?:\u03b4\u03b5\u03bd\s+(?:\u03bc\u03c0\u03bf\u03c1\u03b5\u03b9|\u03bc\u03c0\u03bf\u03c1\u03b5\u03af)?[\s\S]{0,30}(?:\u03bf\u03c5\u03c1|\u03ba\u03b1\u03c4\u03bf\u03c5\u03c1)|\u03c0\u03c1\u03bf\u03c3\u03c0\u03b1\u03b8[\s\S]{0,40}\u03bf\u03c5\u03c1|\u03b1\u03c0\u03bf\u03c6\u03c1\u03b1\u03be|\u03b1\u03c0\u03cc\u03c6\u03c1\u03b1\u03be)/i,
  noUrine:
    /\u03b4\u03b5\u03bd\s+(\u03bc\u03c0\u03bf\u03c1\u03b5\u03b9|\u03bc\u03c0\u03bf\u03c1\u03b5\u03af).*(\u03bf\u03c5\u03c1|\u03ba\u03b1\u03c4\u03bf\u03c5\u03c1)|\u03b4\u03b5\u03bd\s+(\u03bf\u03c5\u03c1|\u03ba\u03b1\u03c4\u03bf\u03c5\u03c1)|\u03c0\u03c1\u03bf\u03c3\u03c0\u03b1\u03b8.*\u03bf\u03c5\u03c1|\u03b1\u03c0\u03bf\u03c6\u03c1\u03b1\u03be|\u03b1\u03c0\u03cc\u03c6\u03c1\u03b1\u03be/i,
  blood:
    /(?:^|[\s,.;:])(?:\u03b1\u03b9\u03bc\u03b1|\u03b1\u03af\u03bc\u03b1)(?:$|[\s,.;:])|\u03bc\u03b1\u03c4\u03c9\u03bd|\u03bc\u03b1\u03c4\u03bf\u03bc\u03b5\u03bd/i,
  persistentVomiting:
    /\u03c3\u03c5\u03bd\u03b5\u03c7.*\u03b5\u03bc\u03b5\u03c4|\u03c3\u03c5\u03bd\u03b5\u03c7.*\u03b5\u03bc\u03ad\u03c4|\u03c0\u03bf\u03bb\u03bb.*\u03b5\u03bc\u03b5\u03c4|\u03c0\u03bf\u03bb\u03bb.*\u03b5\u03bc\u03ad\u03c4/i,
  notEating:
    /\u03b4\u03b5\u03bd\s+(?:\u03c4\u03c1\u03c9\u03b5\u03b9|\u03c4\u03c1\u03ce\u03b5\u03b9)(?:\s*$|\s+(?:\u03b3\u03b9\u03b1|\u03ba\u03b1\u03b8\u03bf\u03bb|\u03ba\u03b1\u03b8\u03cc\u03bb|\d+\s*(?:\u03c9\u03c1|\u03ce\u03c1|\u03b7\u03bc\u03b5\u03c1)))|\u03b1\u03bd\u03bf\u03c1\u03b5\u03be|\u03b1\u03bd\u03bf\u03c1\u03b5\u03be\u03b9\u03b1|\u03c7\u03c9\u03c1\u03b9\u03c2\s+\u03bf\u03c1\u03b5\u03be|\u03c7\u03c9\u03c1\u03af\u03c2\s+\u03cc\u03c1\u03b5\u03be/i,
  severePainOrCollapse:
    /\u03ba\u03b1\u03c4\u03b5\u03c1\u03c1\u03b5\u03c5|\u03ba\u03b1\u03c4\u03ad\u03c1\u03c1\u03b5\u03c5|\u03b5\u03bd\u03c4\u03bf\u03bd.*\u03c0\u03bf\u03bd|\u03ad\u03bd\u03c4\u03bf\u03bd.*\u03c0\u03cc\u03bd|\u03c0\u03bf\u03bd.*\u03ba\u03bf\u03b9\u03bb\u03b9|\u03c0\u03cc\u03bd.*\u03ba\u03bf\u03b9\u03bb\u03b9/i,
  notDrinking:
    /\u03b4\u03b5\u03bd\s+\u03c0\u03b9\u03bd\u03b5\u03b9\s+\u03ba\u03b1\u03b8\u03bf\u03bb|\u03b4\u03b5\u03bd\s+\u03c0\u03af\u03bd\u03b5\u03b9\s+\u03ba\u03b1\u03b8\u03cc\u03bb/i,
  severeAllergy:
    /\u03c0\u03c1\u03b7\u03c3\u03bc.*\u03bc\u03bf\u03c5\u03c4\u03c1|\u03c0\u03c1\u03ae\u03c3\u03bc.*\u03bc\u03bf\u03cd\u03c4\u03c1|\u03b4\u03c5\u03c3\u03ba\u03bf\u03bb.*\u03b1\u03bd\u03b1\u03c0\u03bd|\u03b4\u03cd\u03c3\u03ba\u03bf\u03bb.*\u03b1\u03bd\u03b1\u03c0\u03bd/i,
  renal: /\u03bd\u03b5\u03c6\u03c1|\u03bf\u03c5\u03c1\u03b9\u03b1|\u03bf\u03c5\u03c1\u03af\u03b1|\u03ba\u03c1\u03b5\u03b1\u03c4\u03b9\u03bd/i,
  pancreatitis: /\u03c0\u03b1\u03b3\u03ba\u03c1\u03b5\u03b1\u03c4/i,
  diabetes: /\u03b4\u03b9\u03b1\u03b2\u03b7\u03c4|\u03b4\u03b9\u03b1\u03b2\u03ae\u03c4/i,
};

const RED_FLAG_RULES: SafetyRule[] = [
  {
    code: "male_cat_no_urine",
    patterns: [
      /male\s+cat.*(no\s+urine|can't\s+pee|cannot\s+pee|straining)/i,
      /cat.*(cannot\s+urinate|can't\s+urinate|blocked|urinary\s+blockage)/i,
      greek.maleCatUrinaryBlock,
    ],
    message: {
      el: "Αν αρσενική γάτα ζορίζεται ή δεν μπορεί να ουρήσει, αυτό μπορεί να είναι επείγον. Μην περιμένεις αλλαγή τροφής. Επικοινώνησε άμεσα με κτηνίατρο ή εφημερεύουσα κλινική.",
      en: "If a male cat is straining or cannot urinate, this can be an emergency. Do not wait on a food change. Contact a veterinarian or emergency clinic now.",
    },
  },
  {
    code: "blood_seen",
    patterns: [/blood/i, greek.blood],
    message: {
      el: "Αίμα σε ούρα ή κόπρανα χρειάζεται κτηνιατρικό έλεγχο πριν μιλήσουμε για αλλαγή τροφής.",
      en: "Blood in urine or stool needs veterinary assessment before food changes.",
    },
  },
  {
    code: "persistent_vomiting",
    patterns: [/persistent\s+vomit/i, /repeated\s+vomit/i, /vomiting\s+for/i, greek.persistentVomiting],
    message: {
      el: "Συνεχείς εμετοί δεν πρέπει να αντιμετωπίζονται μόνο με τροφή. Μίλα με κτηνίατρο πριν κάνεις διατροφική αλλαγή.",
      en: "Persistent vomiting should not be managed by diet alone. Speak with a veterinarian before changing food.",
    },
  },
  {
    code: "not_eating",
    patterns: [/not\s+eating/i, /won't\s+eat/i, /no\s+appetite/i, greek.notEating],
    message: {
      el: "Αν δεν τρώει, ειδικά αν είναι γάτα ή κρατάει πάνω από 24 ώρες, χρειάζεται γρήγορη κτηνιατρική καθοδήγηση.",
      en: "Not eating, especially in cats or for more than 24 hours, needs prompt veterinary guidance.",
    },
  },
  {
    code: "collapse_or_severe_pain",
    patterns: [/collapse/i, /collapsed/i, /severe\s+abdominal\s+pain/i, /severe\s+pain/i, greek.severePainOrCollapse],
    message: {
      el: "Κατάρρευση ή έντονος πόνος είναι επείγον σημάδι. Πήγαινε σε κτηνίατρο άμεσα.",
      en: "Collapse or severe pain is an emergency sign. Seek veterinary care now.",
    },
  },
  {
    code: "not_drinking",
    patterns: [/not\s+drinking/i, /no\s+water/i, greek.notDrinking],
    message: {
      el: "Αν δεν πίνει καθόλου νερό ή δείχνει αφυδατωμένο, χρειάζεται κτηνιατρική εκτίμηση πριν από διατροφική σύσταση.",
      en: "If the pet is not drinking or seems dehydrated, veterinary assessment should come before food advice.",
    },
  },
  {
    code: "severe_allergy",
    patterns: [/swollen\s+face/i, /difficulty\s+breathing/i, /severe\s+allergy/i, greek.severeAllergy],
    message: {
      el: "Πρήξιμο στο πρόσωπο ή δυσκολία στην αναπνοή μπορεί να είναι σοβαρή αλλεργική αντίδραση και χρειάζεται άμεση βοήθεια.",
      en: "Facial swelling or breathing difficulty can be a severe allergic reaction and needs urgent help.",
    },
  },
];

const VET_REFERRAL_RULES: SafetyRule[] = [
  {
    code: "renal",
    patterns: [/renal/i, /kidney/i, /ckd/i, greek.renal],
    message: {
      el: "Για νεφρικό περιστατικό, η επιλογή τροφής πρέπει να γίνεται με κτηνίατρο και προσοχή σε φώσφορο/όρεξη/βάρος.",
      en: "For renal disease, diet choice should be veterinarian-guided and phosphorus, appetite, and weight aware.",
    },
  },
  {
    code: "pancreatitis",
    patterns: [/pancreatitis/i, greek.pancreatitis],
    message: {
      el: "Η παγκρεατίτιδα χρειάζεται κτηνιατρική καθοδήγηση και προσεκτικό έλεγχο λιπαρών.",
      en: "Pancreatitis needs veterinarian guidance and careful fat control.",
    },
  },
  {
    code: "diabetes",
    patterns: [/diabetes/i, /diabetic/i, greek.diabetes],
    message: {
      el: "Ο διαβήτης χρειάζεται πρόγραμμα με κτηνίατρο, όχι απλή αλλαγή τροφής.",
      en: "Diabetes needs a veterinarian-guided plan, not a casual food switch.",
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
  const text = textFrom(message, pet);
  const warnings: ChatbotSafetyWarning[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      warnings.push({
        code: rule.code,
        severity: "hard_stop",
        message: rule.message[locale],
      });
    }
  }

  for (const rule of VET_REFERRAL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      warnings.push({
        code: rule.code,
        severity: "warning",
        message: rule.message[locale],
      });
    }
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

  return warnings;
}

export function hasHardStop(warnings: ChatbotSafetyWarning[]) {
  return warnings.some((warning) => warning.severity === "hard_stop");
}

export function formatSafetyInterruptMessage(warnings: ChatbotSafetyWarning[], locale: ChatbotLocale = "el") {
  const hardStops = warnings.filter((warning) => warning.severity === "hard_stop");
  const visibleWarnings = hardStops.length > 0 ? hardStops : warnings;
  const intro =
    locale === "el"
      ? "Πριν μιλήσουμε για τροφή, αυτό χρειάζεται προσοχή:"
      : "Before we talk about food, this needs attention:";
  const outro =
    locale === "el"
      ? "Δεν θα σου εμφανίσω προτάσεις τροφών για αυτό το μήνυμα, γιατί πρώτα πρέπει να αποκλειστεί επείγον περιστατικό."
      : "I will not show food recommendations for this message because an urgent issue should be ruled out first.";

  return [
    intro,
    "",
    ...visibleWarnings.map((warning) => `- ${warning.message}`),
    "",
    outro,
  ].join("\n");
}
