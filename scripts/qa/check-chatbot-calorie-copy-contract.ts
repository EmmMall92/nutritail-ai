import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/chatbot_calorie_copy_contract_qa.md";
const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");

const requiredCustomerPhrases = [
  "Calories in plain language",
  "Basic body calories",
  "This is the energy the body roughly needs before activity and weight goal are added.",
  "Daily calories for this plan:",
  "This is the practical daily amount",
  "Now choose one food card below and I will calculate grams/day to complete the plan.",
  "Με απλά λόγια για τις θερμίδες",
  "Βασικές θερμίδες σώματος",
  "Ημερήσιες θερμίδες για το πλάνο:",
  "Τώρα διάλεξε μία κάρτα τροφής",
];

const forbiddenCustomerPhrases = [
  "RER:",
  "MER/DER:",
  "DER:",
  "Your first nutrition analysis is ready:",
  "Key notes:",
  "Recommended foods:",
  "Daily calorie guide",
  "Resting calories:",
  "Final daily target:",
  "The food cards below are the next step. Choose one option to calculate grams/day.",
  "Οδηγός ημερήσιων θερμίδων",
  "Θερμίδες ηρεμίας:",
  "Τελικός ημερήσιος στόχος:",
  "Οι κάρτες τροφών παρακάτω είναι το επόμενο βήμα.",
];

const failures: string[] = [];

for (const phrase of requiredCustomerPhrases) {
  if (!chatbotPage.includes(phrase)) {
    failures.push(`Missing customer calorie phrase: ${phrase}`);
  }
}

for (const phrase of forbiddenCustomerPhrases) {
  if (chatbotPage.includes(phrase)) {
    failures.push(`Customer chatbot calorie copy still exposes legacy phrase: ${phrase}`);
  }
}

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  [
    "# Chatbot Calorie Copy Contract QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This QA keeps the customer-facing calorie explanation plain and prevents old RER/MER-style labels from returning to the chatbot answer.",
    "",
    "## Summary",
    "",
    `- Required phrases checked: ${requiredCustomerPhrases.length}`,
    `- Forbidden phrases checked: ${forbiddenCustomerPhrases.length}`,
    `- Failed: ${failures.length}`,
    "",
    "## Result",
    "",
    failures.length === 0 ? "PASS" : "FAIL",
    "",
    "## Failures",
    "",
    ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- none"]),
  ].join("\n") + "\n",
  "utf8",
);

if (failures.length > 0) {
  console.error("Chatbot calorie copy contract failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Chatbot calorie copy contract QA passed.");
