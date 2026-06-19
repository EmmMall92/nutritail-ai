import { readFileSync } from "node:fs";

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

const titleRows = parseCsv(
  readFileSync("data/review/food_v2_title_quality_audit.csv", "utf8")
);
const queueRows = parseCsv(
  readFileSync("data/review/food_v2_brand_cleanup_queue.csv", "utf8")
);

const autoCleanRows = titleRows.filter(
  (row) => row.issue_type === "formula_name_brand_prefix_auto_cleaned"
);
const manualBrandPrefixRows = titleRows.filter(
  (row) => row.issue_type === "formula_name_starts_with_brand"
);
const joseraQueue = queueRows.find((row) => row.brand === "Josera");
const topQueue = queueRows[0];

if (autoCleanRows.length < 100) {
  console.error(
    `Expected many auto-cleaned brand-prefix findings, got ${autoCleanRows.length}.`
  );
  process.exit(1);
}

if (manualBrandPrefixRows.length >= autoCleanRows.length) {
  console.error(
    "Brand-prefix findings are still mostly manual instead of auto-cleaned."
  );
  process.exit(1);
}

if (!joseraQueue) {
  console.error("Josera should remain present in the brand cleanup queue.");
  process.exit(1);
}

if (Number(joseraQueue.title_issue_rows) > 5) {
  console.error(
    `Josera manual title issues should be low after auto-cleanup, got ${joseraQueue.title_issue_rows}.`
  );
  process.exit(1);
}

if (topQueue?.brand === "Josera") {
  console.error(
    "Josera should not be top priority only because of auto-cleanable brand prefixes."
  );
  process.exit(1);
}

console.log("Food V2 title audit auto-cleanup QA passed.");
