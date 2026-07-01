import { readFileSync } from "node:fs";

type Finding = {
  file: string;
  line: number;
  marker: string;
  snippet: string;
};

const customerFacingFiles = [
  "app/about/page.tsx",
  "app/account/chatbot/page.tsx",
  "app/account/layout.tsx",
  "app/account/page.tsx",
  "app/account/pets/[id]/page.tsx",
  "app/account/pets/page.tsx",
  "app/account/profile/page.tsx",
  "app/beta/BetaSignupForm.tsx",
  "app/beta/page.tsx",
  "app/forgot-password/page.tsx",
  "app/how-it-works/page.tsx",
  "app/login/page.tsx",
  "app/print/pet-report/[id]/page.tsx",
  "app/print/pet-report/page.tsx",
  "app/print/pet-timeline/[id]/page.tsx",
  "app/privacy/page.tsx",
  "app/register/page.tsx",
  "app/reset-password/page.tsx",
  "app/terms/page.tsx",
];

const literalMarkers = [
  "�",
  "Β·",
  "Ο€",
  "Οƒ",
  "Ο„",
  "Ο‡",
  "Ο‰",
  "Ο",
  "Ο",
  "Ο",
  "Ξ‘",
  "Ξ’",
  "Ξ“",
  "Ξ”",
  "Ξ—",
  "Ξ",
  "Ξ",
  "Ξ",
  "Ξ",
  "Ξ",
  "Ξ ",
  "Ξ£",
  "Ξ¤",
  "Ξ¦",
  "Ξ§",
];

const controlPattern = /[ΞΟ][\u0080-\u009f€ƒ„†‡‰‘’“”•–—™]/u;

function lineFindings(file: string, line: string, index: number): Finding[] {
  const findings: Finding[] = [];

  for (const marker of literalMarkers) {
    if (line.includes(marker)) {
      findings.push({
        file,
        line: index + 1,
        marker,
        snippet: line.trim().slice(0, 180),
      });
    }
  }

  const controlMatch = line.match(controlPattern);
  if (controlMatch) {
    findings.push({
      file,
      line: index + 1,
      marker: controlMatch[0],
      snippet: line.trim().slice(0, 180),
    });
  }

  return findings;
}

const findings = customerFacingFiles.flatMap((file) => {
  const source = readFileSync(file, "utf8");
  return source
    .split(/\r?\n/)
    .flatMap((line, index) => lineFindings(file, line, index));
});

if (findings.length > 0) {
  const rendered = findings
    .slice(0, 40)
    .map(
      (finding) =>
        `${finding.file}:${finding.line} marker=${JSON.stringify(
          finding.marker
        )} ${finding.snippet}`
    )
    .join("\n");

  throw new Error(
    `Customer-facing copy has possible mojibake/encoding artifacts:\n${rendered}`
  );
}

console.log("Customer-facing copy encoding guard passed.");
