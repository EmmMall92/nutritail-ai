import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/customer_ux_copy_contract_qa.md";

const customerCopyFiles = [
  "app/account/page.tsx",
  "app/account/profile/page.tsx",
  "lib/nutrition/chatGuardrails.ts",
];

const bannedCustomerCopy = [
  {
    pattern: /\bneeds_review\b/i,
    reason: "Do not expose Food V2 review status to customers.",
  },
  {
    pattern: /\bsource tier\b/i,
    reason: "Do not expose source-tier wording to customers.",
  },
  {
    pattern: /\bdata quality\b/i,
    reason: "Use customer trust wording instead of backend data-quality labels.",
  },
  {
    pattern: /\bmissing nutrition fields?\b/i,
    reason: "Use simple label-detail wording instead of backend field wording.",
  },
  {
    pattern: /\brecommendation confidence\b/i,
    reason: "Use nutrition-plan/customer wording instead of model or ranking confidence.",
  },
  {
    pattern: /\bScore \d+\/100\b/i,
    reason: "Use customer food-fit wording instead of raw score badges.",
  },
  {
    pattern: /\blegacy food matcher\b/i,
    reason: "Do not expose legacy-system wording to customers.",
  },
];

const requiredCustomerCopy = [
  {
    file: "app/account/page.tsx",
    text: "Κατάσταση διατροφικού πλάνου",
  },
  {
    file: "app/account/page.tsx",
    text: "Fit τροφής:",
  },
  {
    file: "app/account/page.tsx",
    text: "Περισσότερα στοιχεία ετικέτας βελτιώνουν την απάντηση",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "Get daily grams",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Διαχειρίσου τα στοιχεία που συνδέονται με το προφίλ NutriTail AI.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Πώς χρησιμοποιούνται αυτά τα στοιχεία",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Αποθήκευση προφίλ",
  },
];

const bannedExactCustomerStrings = [
  {
    file: "app/account/profile/page.tsx",
    text: "Loading profile...",
    reason: "Profile loading copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Could not load profile",
    reason: "Profile error copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Profile updated successfully.",
    reason: "Profile success copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Back to dashboard",
    reason: "Profile navigation copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "How this information is used",
    reason: "Profile guidance copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Save profile",
    reason: "Profile save copy should be localized for customers.",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "Food match",
    reason: "Chatbot summary should use customer wording such as selected food, not matching internals.",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "No matched food",
    reason: "Chatbot summary should say no food is selected yet, not expose matching internals.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Safety notes:",
    reason: "Guardrail copy should use customer wording instead of internal safety-section labels.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Confidence notes:",
    reason: "Guardrail copy should not expose confidence-section labels to customers.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Useful follow-up questions:",
    reason: "Guardrail copy should ask the next helpful question in customer language.",
  },
];

const failures: string[] = [];

for (const file of customerCopyFiles) {
  const source = readFileSync(file, "utf8");

  for (const banned of bannedCustomerCopy) {
    if (banned.pattern.test(source)) {
      failures.push(`${file}: ${banned.reason}`);
    }
  }
}

for (const required of requiredCustomerCopy) {
  const source = readFileSync(required.file, "utf8");
  if (!source.includes(required.text)) {
    failures.push(`${required.file}: missing required customer copy "${required.text}".`);
  }
}

for (const banned of bannedExactCustomerStrings) {
  const source = readFileSync(banned.file, "utf8");
  if (source.includes(banned.text)) {
    failures.push(`${banned.file}: ${banned.reason}`);
  }
}

function writeReport() {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      "# Customer UX Copy Contract QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "This QA checks customer-facing account/chatbot copy for backend leakage and required customer guidance.",
      "",
      "## Summary",
      "",
      `- Files checked: ${new Set([...customerCopyFiles, ...requiredCustomerCopy.map((item) => item.file)]).size}`,
      `- Banned copy checks: ${bannedCustomerCopy.length}`,
      `- Banned exact string checks: ${bannedExactCustomerStrings.length}`,
      `- Required copy checks: ${requiredCustomerCopy.length}`,
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
}

writeReport();

if (failures.length > 0) {
  console.error("Customer UX copy contract failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Customer UX copy contract QA passed.");
