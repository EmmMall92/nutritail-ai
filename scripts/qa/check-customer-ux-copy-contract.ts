import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/customer_ux_copy_contract_qa.md";

const customerCopyFiles = ["app/account/page.tsx"];

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
    text: "Estimate portions",
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
