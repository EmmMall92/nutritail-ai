import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

function numberFromSummaryLine(report: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = report.match(new RegExp(`- ${escapedLabel}: (\\d+)`));
  return match ? Number(match[1]) : 0;
}

function valueFromSummaryLine(report: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = report.match(new RegExp(`- ${escapedLabel}: (.+)`));
  return match?.[1]?.trim() ?? "";
}

function parseCountSection(report: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = report.match(
    new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`)
  );
  const section = match?.[1] ?? "";

  return section
    .split("\n")
    .map((line) => line.trim().match(/^- (.+): (\d+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      label: match[1],
      count: Number(match[2]),
    }));
}

export async function GET() {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const reportPath = path.join(
    process.cwd(),
    "reports",
    "food_v2_best_candidate_preview.md"
  );
  const report = await readFile(reportPath, "utf8");

  return NextResponse.json({
    generatedAt: report.match(/Generated: (.+)/)?.[1]?.trim() ?? "",
    importableRows: numberFromSummaryLine(
      report,
      "Importable best candidate rows exported"
    ),
    candidateGroups: numberFromSummaryLine(
      report,
      "Candidate groups considered"
    ),
    skippedExistingRows: numberFromSummaryLine(
      report,
      "Already-imported canonical rows skipped"
    ),
    skippedTitleRiskRows: numberFromSummaryLine(
      report,
      "High title-risk rows skipped"
    ),
    missingSourceRows: numberFromSummaryLine(report, "Missing source rows skipped"),
    existingDbCanonicalCheck: valueFromSummaryLine(
      report,
      "Existing DB canonical check"
    ),
    outputCsv: valueFromSummaryLine(report, "Output CSV"),
    bySourcePriority: parseCountSection(report, "By Source Priority"),
    topBrands: parseCountSection(report, "By Brand").slice(0, 12),
  });
}
