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
];

async function runCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = content.includes(check.expected);
  return {
    ...check,
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
