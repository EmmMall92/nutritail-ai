import { readFile } from "node:fs/promises";

const TEMPLATE_PATH = "data/templates/food-document-intake-template.csv";
const INTAKE_PATH = "data/review/food_document_intake.csv";

const requiredHeaders = [
  "intake_id",
  "received_at",
  "brand",
  "formula_name_guess",
  "species",
  "market",
  "locale",
  "source_type",
  "source_priority",
  "evidence_kind",
  "evidence_path_or_url",
  "storage_bucket",
  "storage_path",
  "has_front_pack",
  "has_barcode",
  "has_ingredients",
  "has_analysis",
  "has_calories",
  "has_feeding_guide",
  "has_pack_weight",
  "extraction_status",
  "assigned_to",
  "linked_formula_key",
  "review_priority",
  "notes",
];

const allowedSpecies = new Set(["", "dog", "cat"]);
const allowedSourceTypes = new Set([
  "",
  "official_html",
  "official_pdf",
  "manufacturer_response",
  "authorized_retailer",
  "pack_photo",
  "unknown",
]);
const allowedSourcePriorities = new Set(["", "official", "retailer", "manual_photo", "unknown"]);
const allowedEvidenceKinds = new Set(["", "url", "pdf", "photo_set", "email", "spreadsheet", "mixed"]);
const allowedStatuses = new Set([
  "",
  "new",
  "needs_more_photos",
  "ready_for_extraction",
  "extracted",
  "blocked",
  "rejected",
]);
const allowedPriorities = new Set(["", "high", "medium", "low"]);
const allowedPanelValues = new Set(["", "yes", "no", "unknown"]);

const panelHeaders = [
  "has_front_pack",
  "has_barcode",
  "has_ingredients",
  "has_analysis",
  "has_calories",
  "has_feeding_guide",
  "has_pack_weight",
];

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function validateAllowed(row, field, allowed, label, issues) {
  assert(allowed.has(row[field]), `${label} has invalid ${field}: ${row[field]}`, issues);
}

async function main() {
  const issues = [];
  const template = parseCsv(await readFile(TEMPLATE_PATH, "utf8"));
  const intake = parseCsv(await readFile(INTAKE_PATH, "utf8"));

  assert(
    template.headers.join("|") === intake.headers.join("|"),
    "Food document intake headers must match the template exactly.",
    issues
  );

  for (const header of requiredHeaders) {
    assert(intake.headers.includes(header), `Food document intake is missing ${header}.`, issues);
  }

  const ids = new Set();

  intake.rows.forEach((row, index) => {
    const label = `row ${index + 1}`;

    if (row.intake_id) {
      assert(!ids.has(row.intake_id), `${label} duplicates intake_id ${row.intake_id}.`, issues);
      ids.add(row.intake_id);
    }

    validateAllowed(row, "species", allowedSpecies, label, issues);
    validateAllowed(row, "source_type", allowedSourceTypes, label, issues);
    validateAllowed(row, "source_priority", allowedSourcePriorities, label, issues);
    validateAllowed(row, "evidence_kind", allowedEvidenceKinds, label, issues);
    validateAllowed(row, "extraction_status", allowedStatuses, label, issues);
    validateAllowed(row, "review_priority", allowedPriorities, label, issues);

    for (const header of panelHeaders) {
      validateAllowed(row, header, allowedPanelValues, label, issues);
    }

    if (row.extraction_status === "ready_for_extraction") {
      for (const field of ["intake_id", "brand", "species", "market", "source_type", "source_priority", "evidence_kind"]) {
        assert(row[field], `${label} is ready_for_extraction but missing ${field}.`, issues);
      }
      assert(
        row.evidence_path_or_url || row.storage_path,
        `${label} is ready_for_extraction but has no evidence path or URL.`,
        issues
      );
    }

    if (row.evidence_kind === "photo_set") {
      for (const field of ["has_front_pack", "has_barcode", "has_ingredients", "has_analysis"]) {
        assert(row[field] === "yes", `${label} photo_set should include ${field}=yes before extraction.`, issues);
      }
    }
  });

  if (issues.length > 0) {
    console.error("Food document intake review failed:");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("Food document intake review passed.");
  console.log(`Rows: ${intake.rows.length}`);
  console.log(`Template headers: ${template.headers.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
