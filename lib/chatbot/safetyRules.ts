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

function normalizeSafetyText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rx(pattern: string) {
  return new RegExp(pattern, "i");
}

const greekPatterns = {
  maleCatUrinaryBlock: rx(
    "(γατο|αρσενικ)[\\s\\S]{0,100}(δεν[\\s\\S]{0,40}(ουρ|κατουρ|τσισ)|δυσκολ[\\s\\S]{0,40}(ουρ|κατουρ|τσισ)|προσπαθ[\\s\\S]{0,50}(ουρ|κατουρ|τσισ)|δεν[\\s\\S]{0,40}βγαιν[\\s\\S]{0,30}(ουρ|τσισ)|αποφραξ|φραγμ)"
  ),
  noUrine: rx(
    "δεν[\\s\\S]{0,40}(ουρ|κατουρ|τσισ)|δυσκολ[\\s\\S]{0,40}(ουρ|κατουρ|τσισ)|προσπαθ[\\s\\S]{0,50}(ουρ|κατουρ|τσισ)|αποφραξ|φραγμ"
  ),
  blood: rx(
    "(^|[\\s,.;:])(αιμα|ματωμεν|ματων)([\\s,.;:]|$)|αιμα[\\s\\S]{0,25}(κοπρ|ουρ)|κοπρ[\\s\\S]{0,25}αιμα|ουρ[\\s\\S]{0,25}αιμα"
  ),
  persistentVomiting: rx(
    "(συνεχ|πολλ|επιμον|καθε)[\\s\\S]{0,40}εμετ|εμετ[\\s\\S]{0,40}(συνεχ|πολλ|μερες|ωρες)"
  ),
  notEating: rx(
    "δεν\\s+τρωει[\\s\\S]{0,60}(καθολου|24|48|ωρ|ημερ|μερες)|ανορεξ|χωρις\\s+ορεξ|δεν\\s+εχει\\s+ορεξ"
  ),
  severePainOrCollapse: rx(
    "κατερρευ|εντον[\\s\\S]{0,25}πον|πον[\\s\\S]{0,25}κοιλι|διπλωνεται[\\s\\S]{0,25}πον"
  ),
  notDrinking: rx("δεν\\s+πινει[\\s\\S]{0,30}(καθολου|νερο)|χωρις\\s+νερο|αφυδατ"),
  severeAllergy: rx(
    "πρησμ[\\s\\S]{0,30}(μουτρ|προσωπ)|δυσκολ[\\s\\S]{0,30}αναπν|πνιγ|σοβαρ[\\s\\S]{0,30}αλλεργ"
  ),
  renal: rx("νεφρ|ουρια|κρεατιν|ckd|iris"),
  pancreatitis: rx("παγκρεατ"),
  diabetes: rx("διαβητ"),
};

const RED_FLAG_RULES: SafetyRule[] = [
  {
    code: "male_cat_no_urine",
    patterns: [
      /male\s+cat.*(no\s+urine|can't\s+pee|cannot\s+pee|straining|blocked)/i,
      /cat.*(cannot\s+urinate|can't\s+urinate|blocked|urinary\s+blockage|no\s+urine)/i,
      greekPatterns.maleCatUrinaryBlock,
    ],
    message: {
      el: "Αν αρσενική γάτα ζορίζεται ή δεν μπορεί να ουρήσει, αυτό μπορεί να είναι επείγον. Μην περιμένεις αλλαγή τροφής. Επικοινώνησε άμεσα με κτηνίατρο ή εφημερεύουσα κλινική.",
      en: "If a male cat is straining or cannot urinate, this can be an emergency. Do not wait on a food change. Contact a veterinarian or emergency clinic now.",
    },
  },
  {
    code: "blood_seen",
    patterns: [/blood/i, greekPatterns.blood],
    message: {
      el: "Αίμα σε ούρα ή κόπρανα χρειάζεται κτηνιατρικό έλεγχο πριν μιλήσουμε για αλλαγή τροφής.",
      en: "Blood in urine or stool needs veterinary assessment before food changes.",
    },
  },
  {
    code: "persistent_vomiting",
    patterns: [
      /persistent\s+vomit/i,
      /repeated\s+vomit/i,
      /vomiting\s+for/i,
      greekPatterns.persistentVomiting,
    ],
    message: {
      el: "Συνεχείς ή επαναλαμβανόμενοι εμετοί δεν πρέπει να αντιμετωπίζονται μόνο με τροφή. Μίλα με κτηνίατρο πριν κάνεις διατροφική αλλαγή.",
      en: "Persistent vomiting should not be managed by diet alone. Speak with a veterinarian before changing food.",
    },
  },
  {
    code: "not_eating",
    patterns: [
      /not\s+eating(?:\s*$|\s+(?:at\s+all|anything|for|\d+\s*(?:h|hr|hrs|hour|hours|day|days)))/i,
      /won't\s+eat/i,
      /no\s+appetite/i,
      greekPatterns.notEating,
    ],
    message: {
      el: "Αν δεν τρώει, ειδικά αν είναι γάτα ή κρατάει πάνω από 24 ώρες, χρειάζεται γρήγορη κτηνιατρική καθοδήγηση.",
      en: "Not eating, especially in cats or for more than 24 hours, needs prompt veterinary guidance.",
    },
  },
  {
    code: "collapse_or_severe_pain",
    patterns: [
      /collapse/i,
      /collapsed/i,
      /severe\s+abdominal\s+pain/i,
      /severe\s+pain/i,
      greekPatterns.severePainOrCollapse,
    ],
    message: {
      el: "Κατάρρευση ή έντονος πόνος είναι επείγον σημάδι. Πήγαινε σε κτηνίατρο άμεσα.",
      en: "Collapse or severe pain is an emergency sign. Seek veterinary care now.",
    },
  },
  {
    code: "not_drinking",
    patterns: [/not\s+drinking/i, /no\s+water/i, greekPatterns.notDrinking],
    message: {
      el: "Αν δεν πίνει καθόλου νερό ή δείχνει αφυδατωμένο, χρειάζεται κτηνιατρική εκτίμηση πριν από διατροφική σύσταση.",
      en: "If the pet is not drinking or seems dehydrated, veterinary assessment should come before food advice.",
    },
  },
  {
    code: "severe_allergy",
    patterns: [
      /swollen\s+face/i,
      /difficulty\s+breathing/i,
      /severe\s+allergy/i,
      greekPatterns.severeAllergy,
    ],
    message: {
      el: "Πρήξιμο στο πρόσωπο ή δυσκολία στην αναπνοή μπορεί να είναι σοβαρή αλλεργική αντίδραση και χρειάζεται άμεση βοήθεια.",
      en: "Facial swelling or breathing difficulty can be a severe allergic reaction and needs urgent help.",
    },
  },
];

const VET_REFERRAL_RULES: SafetyRule[] = [
  {
    code: "renal",
    patterns: [/renal/i, /kidney/i, /ckd/i, greekPatterns.renal],
    message: {
      el: "Για νεφρικό περιστατικό, η επιλογή τροφής πρέπει να γίνεται με κτηνίατρο και προσοχή σε φώσφορο, όρεξη και βάρος.",
      en: "For renal disease, diet choice should be veterinarian-guided and phosphorus, appetite, and weight aware.",
    },
  },
  {
    code: "pancreatitis",
    patterns: [/pancreatitis/i, greekPatterns.pancreatitis],
    message: {
      el: "Η παγκρεατίτιδα χρειάζεται κτηνιατρική καθοδήγηση και προσεκτικό έλεγχο λιπαρών. Δεν προτείνουμε υψηλά λιπαρά σε τέτοιο ιστορικό.",
      en: "Pancreatitis needs veterinarian guidance and careful fat control. High-fat food should not be recommended for this history.",
    },
  },
  {
    code: "diabetes",
    patterns: [/diabetes/i, /diabetic/i, greekPatterns.diabetes],
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
  const text = normalizeSafetyText(textFrom(message, pet));
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

export function formatSafetyInterruptMessage(
  warnings: ChatbotSafetyWarning[],
  locale: ChatbotLocale = "el"
) {
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
