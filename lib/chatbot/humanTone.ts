import type { ChatbotLocale } from "@/lib/chatbot/types";

export type HumanTonePlan = {
  locale: ChatbotLocale;
  style_rules: string[];
  opening_style: string;
  uncertainty_phrase: string;
  one_question_rule: string;
};

export function detectMessageLocale(message: string): ChatbotLocale {
  return /[α-ωάέήίόύώϊϋΐΰ]/i.test(message) ? "el" : "en";
}

export function getHumanTonePlan(message: string): HumanTonePlan {
  const locale = detectMessageLocale(message);

  if (locale === "el") {
    return {
      locale,
      style_rules: [
        "Απάντα στα ελληνικά όταν ο χρήστης γράφει ελληνικά.",
        "Γράψε σαν έμπειρος petshop advisor: απλά, ζεστά, πρακτικά.",
        "Πρώτα σύντομη απάντηση, μετά εξήγηση μόνο όσο χρειάζεται.",
        "Μην ακούγεσαι ρομποτικός και μη γεμίζεις την απάντηση με τεχνικούς όρους.",
        "Μην κάνεις διάγνωση ή θεραπευτικές υποσχέσεις.",
      ],
      opening_style: "Ξεκίνα με άμεση, ανθρώπινη απάντηση.",
      uncertainty_phrase: "Με τα δεδομένα που έχω, θα το πω προσεκτικά:",
      one_question_rule: "Ρώτα μόνο μία ερώτηση τη φορά.",
    };
  }

  return {
    locale,
    style_rules: [
      "Answer in English when the user writes English.",
      "Sound like an excellent petshop advisor: warm, simple, and practical.",
      "Give the short answer first, then deeper explanation only when needed.",
      "Avoid robotic wording and avoid unnecessary technical detail.",
      "Do not diagnose or make treatment claims.",
    ],
    opening_style: "Start with a direct, human answer.",
    uncertainty_phrase: "With the data I have, I would phrase this carefully:",
    one_question_rule: "Ask only one question at a time.",
  };
}

export function uncertaintyForMissingData(missingFields: string[], locale: ChatbotLocale) {
  if (missingFields.length === 0) return "";

  return locale === "el"
    ? `Λείπουν ακόμη: ${missingFields.join(", ")}. Άρα η απάντηση πρέπει να είναι πιο προσεκτική.`
    : `Still missing: ${missingFields.join(", ")}. So the answer should stay cautious.`;
}
