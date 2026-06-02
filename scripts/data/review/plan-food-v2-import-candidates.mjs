import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputs = [
  "data/imports/royal_canin_cat_photo_pilot_v2.csv",
  "data/imports/royal_canin_dog_photo_batch_v2.csv",
  "data/imports/wave1_royal_josera_foods_v2.csv",
  "data/imports/acana_document_extract_v2.csv",
  "data/imports/orijen_document_extract_v2.csv",
  "data/imports/purina_pro_plan_dog_document_extract_v2.csv",
  "data/imports/purina_cat_chow_document_extract_v2.csv",
  "data/imports/purina_official_enrichment_extract_v2.csv",
  "data/imports/ambrosia_document_extract_v2.csv",
  "data/imports/belcando_document_extract_v2.csv",
  "data/imports/sams_field_document_extract_v2.csv",
  "data/imports/unica_classe_document_extract_v2.csv",
  "data/imports/josera_document_extract_v2.csv",
  "data/imports/aatu_barking_heads_document_extract_v2.csv",
  "data/imports/schesir_dry_document_extract_v2.csv",
  "data/imports/unica_natura_document_extract_v2.csv",
  "data/imports/cat_dry_analysis_document_extract_v2.csv",
  "data/imports/vet_eshop_document_extract_v2.csv",
  "data/imports/gheda_schesir_spreadsheet_extract_v2.csv",
  "data/imports/schesir_gheda_marketplace_ods_extract_v2.csv",
  "data/imports/schesir_official_enrichment_extract_v2.csv",
  "data/imports/retailer_source_backfill_v2.csv",
  "data/imports/gatoskilo_product_extract_v2.csv",
  "data/imports/petshop88_product_extract_v2.csv",
  "data/imports/external_product_sources_extract_v2.csv",
  "data/imports/category_product_sources_extract_v2.csv",
  "data/imports/gatoskilo_royal_canin_dog_html_batch_v2.csv",
  "data/imports/royal_canin_gr_product_extract_v2.csv",
  "data/imports/dog_dog_wild_pdf_extract_v2.csv",
  "data/imports/prochoice_pdf_extract_v2.csv",
  "data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv",
  "data/imports/mixed_eshop_spreadsheet_extract_v2.csv",
];

const paths = {
  queue: "data/review/food_v2_import_candidate_queue.csv",
  report: "reports/food_v2_import_candidate_queue.md",
};

const headers = [
  "decision",
  "dataset_file",
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "quality_status",
  "source_priority",
  "title_source_priority",
  "missing_blockers",
  "next_action",
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

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function titleSourceRank(row) {
  const sourceUrl = normalizeSearchText(row.data_source_url);
  const notes = normalizeSearchText(row.source_notes);
  const dataset = normalizeSearchText(row.dataset_file);
  const combined = `${sourceUrl} ${notes} ${dataset}`;

  if (combined.includes("gatoskilo")) return 60;
  if (
    combined.includes(".pdf") ||
    combined.includes("source_tier=uploaded_document") ||
    combined.includes("source_tier=uploaded_pdf") ||
    combined.includes("source_kind=pdf") ||
    combined.includes("document_extract") ||
    combined.includes("pdf_extract")
  ) {
    return 50;
  }
  if (row.source_priority === "official") return 40;
  if (combined.includes("zooplus")) return 30;
  if (
    combined.includes("petshop88") ||
    combined.includes("pet-it") ||
    combined.includes("petcity")
  ) {
    return 25;
  }
  if (combined.includes("petsamolis")) return 10;
  if (row.source_priority === "retailer") return 20;
  if (row.source_priority === "manual_photo") return 5;
  return 0;
}

function decisionRank(decision) {
  if (decision === "candidate") return 0;
  if (decision === "hold") return 1;
  if (decision === "reject") return 2;
  return 3;
}

function blockers(row) {
  const required = [
    "brand",
    "formula_name",
    "species",
    "format",
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "formula_key",
  ];
  const missing = required.filter((field) => !hasValue(row[field]));
  if (!hasValue(row.kcal_per_100g) && !hasValue(row.kcal_per_kg)) {
    missing.push("kcal_per_100g_or_kcal_per_kg");
  }
  if (!hasValue(row.data_source_url) && row.source_priority !== "manual_photo") {
    missing.push("data_source_url_or_manual_photo");
  }
  if (row.data_quality_status === "verified" && row.source_priority !== "official") {
    missing.push("verified_without_official_source");
  }
  return missing;
}

function decisionFor(row, missing) {
  if (missing.length === 0 && ["verified", "needs_review"].includes(row.data_quality_status)) {
    return "candidate";
  }
  if (missing.some((field) => field.startsWith("verified_without"))) return "reject";
  return "hold";
}

function nextActionFor(missing) {
  if (missing.length === 0) return "Preview in admin and commit only after human QA.";
  if (missing.includes("ingredient_text")) return "Transcribe ingredients/composition from evidence.";
  if (missing.includes("kcal_per_100g_or_kcal_per_kg")) return "Find calories/ME from label or official source.";
  if (missing.includes("data_source_url_or_manual_photo")) return "Attach official URL or manual photo evidence path.";
  if (missing.some((field) => field.endsWith("_percent"))) {
    return "Backfill analytical constituents from evidence.";
  }
  return "Resolve missing blockers before admin preview.";
}

async function rowsForFile(file) {
  const rows = parseCsv(await readFile(file, "utf8"));
  return rows.map((row) => {
    const missing = blockers(row);
    return {
      decision: decisionFor(row, missing),
      dataset_file: file,
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      quality_status: row.data_quality_status,
      source_priority: row.source_priority,
      title_source_priority: titleSourceRank({ ...row, dataset_file: file }),
      missing_blockers: missing.join("|"),
      next_action: nextActionFor(missing),
    };
  });
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
  return `# Food V2 Import Candidate Queue

Generated: ${new Date().toISOString()}

## Summary

- Queue rows: ${rows.length}
- Candidate rows: ${rows.filter((row) => row.decision === "candidate").length}
- Hold rows: ${rows.filter((row) => row.decision === "hold").length}
- Reject rows: ${rows.filter((row) => row.decision === "reject").length}
- Output CSV: ${paths.queue}

## By Decision

${renderCounts(countBy(rows, "decision"))}

## By Dataset

${renderCounts(countBy(rows, "dataset_file"))}

## Operating Rule

Only candidate rows may move to admin preview for commit. Hold rows stay in review until missing blockers are resolved.

Title priority is Gatoskilo first, uploaded PDF/document extracts second, official product pages third, other retailer pages after that, and Petsamolis last. Food display names should include the brand, e.g. "Ambrosia Mediterranean Diet Grain Free Puppy Fresh Sardine & Herring".
`;
}

async function main() {
  const rows = [];
  for (const input of inputs) {
    rows.push(...(await rowsForFile(input)));
  }
  const sorted = rows.sort(
    (a, b) =>
      decisionRank(a.decision) - decisionRank(b.decision) ||
      Number(b.title_source_priority || 0) - Number(a.title_source_priority || 0) ||
      a.brand.localeCompare(b.brand) ||
      a.formula_name.localeCompare(b.formula_name)
  );
  await mkdir(path.dirname(paths.queue), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.queue, writeCsv(sorted), "utf8");
  await writeFile(paths.report, renderReport(sorted), "utf8");
  console.log(`Food V2 import candidate queue rows: ${sorted.length}`);
  console.log(`Wrote ${paths.queue}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
