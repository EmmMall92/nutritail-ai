import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputs = [
  {
    label: "Royal Canin cat photo pilot",
    file: "data/imports/royal_canin_cat_photo_pilot_v2.csv",
  },
  {
    label: "Royal Canin dog photo batch",
    file: "data/imports/royal_canin_dog_photo_batch_v2.csv",
  },
  {
    label: "Wave 1 Royal/Josera",
    file: "data/imports/wave1_royal_josera_foods_v2.csv",
  },
];

const paths = {
  csv: "data/review/food_v2_preview_readiness.csv",
  report: "reports/food_v2_preview_readiness.md",
};

const headers = [
  "dataset",
  "file",
  "total_rows",
  "preview_ready_rows",
  "blocked_rows",
  "top_blockers",
  "recommendation",
];

const requiredFields = [
  "brand",
  "formula_name",
  "species",
  "format",
  "ingredient_text",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "data_quality_status",
  "source_priority",
  "source_notes",
  "formula_key",
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

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function missingFields(row) {
  const missing = requiredFields.filter((field) => !hasValue(row[field]));
  if (!hasValue(row.kcal_per_100g) && !hasValue(row.kcal_per_kg)) {
    missing.push("kcal_per_100g_or_kcal_per_kg");
  }
  if (!hasValue(row.data_source_url) && row.source_priority !== "manual_photo") {
    missing.push("data_source_url_or_manual_photo");
  }
  return missing;
}

function countValues(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function renderTop(counts, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([field, count]) => `${field}:${count}`)
    .join("|");
}

function recommendationFor(totalRows, previewReadyRows) {
  if (totalRows === 0) return "No rows to review.";
  if (previewReadyRows === totalRows) return "Ready for admin preview.";
  if (previewReadyRows > 0) return "Preview ready rows only; keep blocked rows in review.";
  return "Do not import yet; resolve blockers first.";
}

async function summarizeInput(input) {
  const rows = parseCsv(await readFile(input.file, "utf8"));
  const missingByRow = rows.map(missingFields);
  const blockedRows = missingByRow.filter((fields) => fields.length > 0).length;
  const blockerCounts = countValues(missingByRow.flat());

  return {
    dataset: input.label,
    file: input.file,
    total_rows: rows.length,
    preview_ready_rows: rows.length - blockedRows,
    blocked_rows: blockedRows,
    top_blockers: renderTop(blockerCounts),
    recommendation: recommendationFor(rows.length, rows.length - blockedRows),
  };
}

function renderReport(rows) {
  return `# Food V2 Preview Readiness

Generated: ${new Date().toISOString()}

## Summary

${rows
  .map(
    (row) =>
      `- ${row.dataset}: ${row.preview_ready_rows}/${row.total_rows} preview-ready, ${row.blocked_rows} blocked`
  )
  .join("\n")}

## Recommendations

${rows.map((row) => `- ${row.dataset}: ${row.recommendation}`).join("\n")}

## Output

- CSV: ${paths.csv}
`;
}

async function main() {
  const rows = [];
  for (const input of inputs) {
    rows.push(await summarizeInput(input));
  }

  await mkdir(path.dirname(paths.csv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csv, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");
  console.log(`Food V2 preview readiness datasets: ${rows.length}`);
  console.log(`Wrote ${paths.csv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
