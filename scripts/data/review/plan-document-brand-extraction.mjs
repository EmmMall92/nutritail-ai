import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  intake: "data/review/food_document_intake.csv",
  plan: "data/review/document_brand_extraction_plan.csv",
  report: "reports/document_brand_extraction_plan.md",
};

const headers = [
  "priority",
  "brand",
  "source_type",
  "evidence_kind",
  "evidence_path_or_url",
  "target_output",
  "extraction_strategy",
  "status",
  "notes",
];

const brandPriority = {
  ACANA: "high",
  ORIJEN: "high",
  Josera: "high",
  Purina: "high",
  Ambrosia: "high",
  "Schesir/Gheda": "medium",
  Belcando: "medium",
  Unica: "medium",
  Prochoice: "medium",
  AATU: "low",
  "Barking Heads": "low",
  "Sam's Field": "low",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const csvHeaders = (rows[0] ?? []).map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function priorityRank(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function targetOutput(row) {
  const brand = row.brand || row.formula_name_guess || "unknown";
  return `data/imports/${brand.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_document_extract_v2.csv`;
}

function strategyFor(row) {
  if (row.evidence_kind === "spreadsheet") {
    return "Parse sheets into review rows; treat as retailer/supporting evidence unless manufacturer values are obvious.";
  }
  if (row.evidence_kind === "pdf") {
    return "Extract product text and analytical tables; preserve page evidence references.";
  }
  if (row.evidence_kind === "mixed") {
    return "Extract document paragraphs/tables into raw rows, then normalize into Food V2 review CSV.";
  }
  return "Review evidence manually before extraction.";
}

function shouldInclude(row) {
  if (row.evidence_kind === "photo_set") return false;
  if (!row.evidence_path_or_url) return false;
  return true;
}

function normalizeBrand(row) {
  return row.brand || row.formula_name_guess || "unknown";
}

function planRow(row) {
  const brand = normalizeBrand(row);
  return {
    priority: brandPriority[brand] ?? "low",
    brand,
    source_type: row.source_type,
    evidence_kind: row.evidence_kind,
    evidence_path_or_url: row.evidence_path_or_url,
    target_output: targetOutput({ ...row, brand }),
    extraction_strategy: strategyFor(row),
    status: "planned",
    notes: row.notes,
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
}

function renderReport(rows) {
  return `# Document Brand Extraction Plan

Generated: ${new Date().toISOString()}

## Summary

- Planned document/spreadsheet/PDF rows: ${rows.length}
- Output CSV: ${paths.plan}
- Source intake: ${paths.intake}

## By Priority

${renderCounts(countBy(rows, "priority"))}

## By Brand

${renderCounts(countBy(rows, "brand"))}

## By Evidence Kind

${renderCounts(countBy(rows, "evidence_kind"))}

## Recommended Order

${rows
  .slice(0, 12)
  .map((row) => `- ${row.priority}: ${row.brand} - ${row.evidence_kind}`)
  .join("\n")}
`;
}

async function main() {
  const intakeRows = parseCsv(await readFile(paths.intake, "utf8"));
  const rows = intakeRows
    .filter(shouldInclude)
    .map(planRow)
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        a.brand.localeCompare(b.brand) ||
        a.evidence_kind.localeCompare(b.evidence_kind)
    );

  await mkdir(path.dirname(paths.plan), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.plan, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");
  console.log(`Document brand extraction plan rows: ${rows.length}`);
  console.log(`Wrote ${paths.plan}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
