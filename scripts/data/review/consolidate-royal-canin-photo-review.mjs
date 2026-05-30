import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  catReview: "data/review/royal_canin_cat_photo_pilot_review.csv",
  dogReview: "data/review/royal_canin_dog_photo_batch_review.csv",
  output: "data/review/royal_canin_photo_review_consolidated.csv",
  report: "reports/royal_canin_photo_review_consolidated.md",
};

const outputHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "missing_fields",
  "evidence_path",
  "image_count",
  "recommended_action",
  "notes",
];

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

  const headers = (rows[0] ?? []).map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function countMissingFields(rows) {
  return rows.reduce((acc, row) => {
    String(row.missing_fields ?? "")
      .split("|")
      .map((field) => field.trim())
      .filter(Boolean)
      .forEach((field) => {
        acc[field] = (acc[field] ?? 0) + 1;
      });
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
}

function normalizeRow(row) {
  return Object.fromEntries(outputHeaders.map((header) => [header, row[header] ?? ""]));
}

function renderReport(rows) {
  const missingCounts = countMissingFields(rows);

  return `# Royal Canin Photo Review Consolidated

Generated: ${new Date().toISOString()}

## Summary

- Review rows: ${rows.length}
- Consolidated CSV: ${paths.output}
- Cat pilot source: ${paths.catReview}
- Dog batch source: ${paths.dogReview}

## By Species

${renderCounts(countBy(rows, "species"))}

## By Status

${renderCounts(countBy(rows, "status"))}

## Top Missing Fields

${renderCounts(missingCounts)}

## Decision

Royal Canin photo evidence is now consolidated into one review queue. None of these rows should be committed as verified production nutrition data until missing calories, analytical constituents, barcode/EAN, and transcription QA are resolved.
`;
}

async function main() {
  const catRows = parseCsv(await readFile(paths.catReview, "utf8")).map(normalizeRow);
  const dogRows = parseCsv(await readFile(paths.dogReview, "utf8")).map(normalizeRow);
  const rows = [...catRows, ...dogRows].sort(
    (a, b) => a.species.localeCompare(b.species) || a.formula_name.localeCompare(b.formula_name)
  );

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(outputHeaders, rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Royal Canin consolidated review rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
