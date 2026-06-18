import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_chatbot_flow_links_qa.md";

const checks = [
  {
    label: "Chatbot reads petId query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("petId")',
  },
  {
    label: "Chatbot reads progress mode query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("mode")',
  },
  {
    label: "Chatbot opens direct progress mode",
    file: "app/account/chatbot/page.tsx",
    expected: 'mode === "progress"',
  },
  {
    label: "Account dashboard progress action deep-links to saved pet",
    file: "app/account/page.tsx",
    expected: "/account/chatbot?petId=${latestPet.id}&mode=progress",
  },
  {
    label: "Pets list progress action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pets list run analysis action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Pet detail progress action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pet detail analysis action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Saved chatbot analysis links to printable report",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-report/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to printable timeline",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-timeline/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to progress check",
    file: "app/account/chatbot/page.tsx",
    expected: "/account/chatbot?petId=${savedPetId}&mode=progress",
  },
  {
    label: "Recommendation cards preview grams before choosing food",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoicePortionPreview",
  },
  {
    label: "Recommendation cards expose customer portion label",
    file: "app/account/chatbot/page.tsx",
    expected: "Estimated portion",
  },
  {
    label: "Recommendation composer has compact customer fallback",
    file: "app/account/chatbot/page.tsx",
    expected: "formatCompactFoodV2RecommendationFallback",
  },
  {
    label: "Compact recommendation fallback points to food cards",
    file: "app/account/chatbot/page.tsx",
    expected: "Tap one card below",
  },
];

const forbiddenChecks = [
  {
    label: "Current-food candidate copy does not expose matcher score",
    file: "app/account/chatbot/page.tsx",
    forbidden: "${confidence}, score ${score}",
  },
  {
    label: "Current-food quality note does not expose data-quality label",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Data quality:",
  },
];

async function runCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = content.includes(check.expected);
  return {
    ...check,
    ok,
  };
}

async function runForbiddenCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = !content.includes(check.forbidden);
  return {
    label: check.label,
    file: check.file,
    ok,
  };
}

function renderTable(rows) {
  return [
    "| Check | File | Result |",
    "| --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.label} | \`${row.file}\` | ${row.ok ? "pass" : "fail"} |`
    ),
  ].join("\n");
}

async function main() {
  const rows = [];

  for (const check of checks) {
    rows.push(await runCheck(check));
  }

  for (const check of forbiddenChecks) {
    rows.push(await runForbiddenCheck(check));
  }

  const passed = rows.filter((row) => row.ok).length;
  const failed = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Customer Chatbot Flow Link QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Checks: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      "",
      "This guards the customer flow where account and pet pages should open the chatbot with the correct saved pet context, especially progress checks.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        checked: rows.length,
        passed,
        failed,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
