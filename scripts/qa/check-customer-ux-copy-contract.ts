import { readFileSync } from "node:fs";

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
];

const requiredCustomerCopy = [
  {
    file: "app/account/page.tsx",
    text: "Nutrition plan status",
  },
  {
    file: "app/account/page.tsx",
    text: "Better label details improve the answer",
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

if (failures.length > 0) {
  console.error("Customer UX copy contract failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Customer UX copy contract QA passed.");
