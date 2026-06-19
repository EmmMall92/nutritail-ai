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

const acceptedMedicalProductLines = titleRows.filter(
  (row) => row.issue_type === "medical_claim_product_line_ok"
);
const manualMedicalRows = titleRows.filter(
  (row) => row.issue_type === "medical_claim_used_as_name"
);
const conciseManualRows = manualMedicalRows.filter((row) => {
  const words = row.formula_name.split(/\s+/u).filter(Boolean).length;
  return words <= 9 && !/\b(?:for|support|management|treatment|reduction)\s+of\b/i.test(row.formula_name);
});
const royalQueue = queueRows.find((row) => row.brand === "Royal Canin");
const hillsQueue = queueRows.find((row) => row.brand === "Hills");

if (acceptedMedicalProductLines.length < 10) {
  console.error(
    `Expected concise veterinary product-line names to remain visible as info findings, got ${acceptedMedicalProductLines.length}.`
  );
  process.exit(1);
}

if (conciseManualRows.length > 0) {
  console.error(
    `Concise veterinary product-line names should not be manual title blockers, got ${conciseManualRows.length}.`
  );
  process.exit(1);
}

if (!royalQueue || !hillsQueue) {
  console.error("Royal Canin and Hills should remain visible in the cleanup queue.");
  process.exit(1);
}

if (Number(royalQueue.title_issue_rows) > 6) {
  console.error(
    `Royal Canin title issues should ignore concise vet product lines, got ${royalQueue.title_issue_rows}.`
  );
  process.exit(1);
}

if (Number(hillsQueue.title_issue_rows) > 8) {
  console.error(
    `Hills title issues should ignore concise vet product lines, got ${hillsQueue.title_issue_rows}.`
  );
  process.exit(1);
}

console.log("Food V2 veterinary title audit QA passed.");
