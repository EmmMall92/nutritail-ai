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

const grainFreePackFindings = titleRows.filter(
  (row) =>
    row.issue_type.endsWith("formula_contains_pack_or_offer") &&
    /\bgrain\s*-?\s*free\b/i.test(row.formula_name) &&
    !/\b(?:economy\s+pack|pack|offer|promo|gift)\b/i.test(row.formula_name) &&
    !/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/i.test(row.formula_name)
);
const petsamolisManualFindings = titleRows.filter(
  (row) =>
    row.audit_source === "category_product_sources_registry" &&
    row.formula_key.includes("petsamolis.gr") &&
    row.severity !== "info"
);
const petsamolisInfoFindings = titleRows.filter(
  (row) =>
    row.audit_source === "category_product_sources_registry" &&
    row.formula_key.includes("petsamolis.gr") &&
    row.severity === "info" &&
    row.issue_type.startsWith("source_registry_fallback_")
);
const ambrosiaQueue = queueRows.find((row) => row.brand === "Ambrosia");
const topQueue = queueRows[0];

if (grainFreePackFindings.length > 0) {
  console.error(
    `Grain Free titles should not be treated as pack/offer wording. Found ${grainFreePackFindings.length}.`
  );
  process.exit(1);
}

if (petsamolisManualFindings.length > 0) {
  console.error(
    `Petsamolis source-registry fallback titles should be info-only, got ${petsamolisManualFindings.length} manual findings.`
  );
  process.exit(1);
}

if (petsamolisInfoFindings.length < 10) {
  console.error(
    `Expected Petsamolis fallback title findings to remain visible as info evidence, got ${petsamolisInfoFindings.length}.`
  );
  process.exit(1);
}

if (!ambrosiaQueue) {
  console.error("Ambrosia should remain visible in the brand cleanup queue.");
  process.exit(1);
}

if (Number(ambrosiaQueue.title_issue_rows) > 8) {
  console.error(
    `Ambrosia manual title issues should be low after source-priority cleanup, got ${ambrosiaQueue.title_issue_rows}.`
  );
  process.exit(1);
}

if (topQueue?.brand === "Ambrosia") {
  console.error(
    "Ambrosia should not be top priority because of low-priority source-registry fallback descriptions."
  );
  process.exit(1);
}

console.log("Food V2 source title priority QA passed.");
