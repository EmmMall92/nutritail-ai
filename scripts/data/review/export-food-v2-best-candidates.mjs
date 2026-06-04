import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  dedupeGroups: "data/review/food_v2_source_dedupe_groups.csv",
  output: "data/imports/food_v2_best_candidate_preview.csv",
  report: "reports/food_v2_best_candidate_preview.md",
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

  const headers = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function templateHeaders(text) {
  return parseCsv(`${text.trimEnd()}\n`).length > 0
    ? Object.keys(parseCsv(`${text.trimEnd()}\n`)[0])
    : text
        .split(/\r?\n/u)[0]
        .replace(/^\uFEFF/u, "")
        .split(",")
        .map((header) => header.trim());
}

async function readImportRows(datasetFile) {
  try {
    const rows = parseCsv(await readFile(path.join(process.cwd(), datasetFile), "utf8"));
    return new Map(rows.map((row) => [row.formula_key, row]));
  } catch {
    return new Map();
  }
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => `- ${key}: ${count}`)
    .join("\n");
}

function renderReport({ groups, exportedRows, missingRows }) {
  return `# Food V2 Best Candidate Preview Export

Generated: ${new Date().toISOString()}

## Summary

- Importable best candidate rows exported: ${exportedRows.length}
- Candidate groups considered: ${groups.length}
- Missing source rows skipped: ${missingRows.length}
- Output CSV: ${paths.output}

## By Source Priority

${renderCounts(countBy(exportedRows, "source_priority")) || "- none"}

## By Dataset

${renderCounts(countBy(exportedRows, "_dataset_file")) || "- none"}

## Operating Rule

This file contains one best candidate row per canonical formula identity. It is intended for Admin Food V2 preview before commit. Alternative rows remain in the dedupe review files as evidence/backfill references.
`;
}

async function main() {
  const headers = templateHeaders(await readFile(paths.template, "utf8"));
  const dedupeGroups = parseCsv(await readFile(paths.dedupeGroups, "utf8"));
  const candidateGroups = dedupeGroups.filter((row) => row.best_decision === "candidate");
  const datasetFiles = [...new Set(candidateGroups.map((row) => row.best_dataset_file))];
  const rowsByDataset = new Map();

  for (const datasetFile of datasetFiles) {
    rowsByDataset.set(datasetFile, await readImportRows(datasetFile));
  }

  const missingRows = [];
  const exportedRows = [];

  for (const group of candidateGroups) {
    const sourceRows = rowsByDataset.get(group.best_dataset_file);
    const sourceRow = sourceRows?.get(group.best_formula_key);
    if (!sourceRow) {
      missingRows.push(group);
      continue;
    }

    const exportedRow = Object.fromEntries(
      headers.map((header) => [header, sourceRow[header] ?? ""])
    );
    exportedRow._dataset_file = group.best_dataset_file;
    exportedRows.push(exportedRow);
  }

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, exportedRows), "utf8");
  await writeFile(
    paths.report,
    renderReport({ groups: candidateGroups, exportedRows, missingRows }),
    "utf8"
  );

  console.log(`Food V2 best candidate rows exported: ${exportedRows.length}`);
  console.log(`Missing source rows skipped: ${missingRows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
