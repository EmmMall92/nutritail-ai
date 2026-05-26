import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const WRITE_REPORT = process.argv.includes("--write-report");

const paths = {
  jsonMaster: "data/imports/nutritail_foods_euuk_v1.json",
  csvMirror: "data/imports/nutritail_foods_euuk_v1.csv",
  skuMap: "data/imports/nutritail_foods_euuk_v1_sku_map.csv",
  missingPhotoQueue: "data/imports/nutritail_foods_missing_photo_queue.csv",
  photoManifest: "data/imports/nutritail_foods_photo_manifest.csv",
  marketScope: "data/config/food_market_scope.json",
  qualityRules: "data/config/food_quality_rules.json",
  sourceRegistry: "data/sources/food_source_registry.csv",
  brandPriority: "data/sources/brand_priority_euuk.csv",
  report: "reports/foods_dataset_audit.md",
};

const expectedHeaders = {
  csvMirror: [
    "brand",
    "name",
    "species",
    "life_stage",
    "size",
    "tags",
    "ingredients",
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "sodium_percent",
    "magnesium_percent",
    "calcium_percent",
    "phosphorus_percent",
    "data_quality_status",
    "data_source_url",
    "data_notes",
  ],
  skuMap: [
    "formula_key",
    "brand",
    "name",
    "species",
    "market",
    "pack_size",
    "barcode",
    "source_url",
    "evidence_photo_path",
    "notes",
  ],
  missingPhotoQueue: [
    "formula_key",
    "brand",
    "name",
    "species",
    "market",
    "missing_fields",
    "data_source_url",
    "priority",
    "notes",
  ],
  photoManifest: [
    "formula_key",
    "brand_guess",
    "name_guess",
    "species_guess",
    "market",
    "pack_size",
    "barcode",
    "front_photo",
    "ingredients_photo",
    "analysis_photo",
    "calorie_photo",
    "notes",
  ],
  sourceRegistry: [
    "brand",
    "source_domain",
    "market",
    "source_tier",
    "extraction_type",
    "parser_notes",
  ],
  brandPriority: [
    "priority_wave",
    "brand_cohort",
    "source_domains",
    "why_this_wave",
  ],
};

const allowedStatuses = new Set([
  "verified",
  "partial",
  "needs_review",
  "unknown",
]);
const allowedSpecies = new Set(["dog", "cat"]);

function fullPath(relativePath) {
  return path.join(ROOT, relativePath);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMarket(dataNotes) {
  return dataNotes?.match(/(?:^|;\s*)market=([^;]+)/)?.[1]?.trim() || "EUUK";
}

function buildFormulaKey(row) {
  return slugify(`${row.brand}-${row.name}-${row.species}-${extractMarket(row.data_notes)}`);
}

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
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });

  return { headers, rows };
}

function sameHeaders(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((header, index) => header === expected[index])
  );
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

function issue(list, type, message) {
  list.push({ type, message });
}

async function readText(relativePath, issues) {
  try {
    return await readFile(fullPath(relativePath), "utf8");
  } catch {
    issue(issues, "error", `Missing or unreadable file: ${relativePath}`);
    return null;
  }
}

function validateHeaders(name, parsedCsv, issues) {
  if (!sameHeaders(parsedCsv.headers, expectedHeaders[name])) {
    issue(
      issues,
      "error",
      `${paths[name]} headers do not match the dataset contract.`
    );
  }
}

function validateFoodRows(rows, issues) {
  const formulaKeys = new Set();
  const requiredForAllRows = [
    "brand",
    "name",
    "species",
    "ingredients",
    "data_quality_status",
    "data_source_url",
    "data_notes",
  ];
  const requiredForProduction = [
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "calcium_percent",
    "phosphorus_percent",
  ];

  rows.forEach((row, index) => {
    const label = `JSON row ${index + 1}`;

    requiredForAllRows.forEach((field) => {
      if (!hasValue(row[field])) {
        issue(issues, "error", `${label} is missing ${field}.`);
      }
    });

    if (row.species && !allowedSpecies.has(row.species)) {
      issue(issues, "error", `${label} has unsupported species: ${row.species}.`);
    }

    if (!allowedStatuses.has(row.data_quality_status)) {
      issue(
        issues,
        "error",
        `${label} has unsupported data_quality_status: ${row.data_quality_status}.`
      );
    }

    if (!String(row.data_notes ?? "").includes("market=")) {
      issue(issues, "error", `${label} data_notes must include market=.`);
    }

    if (!String(row.data_notes ?? "").includes("source_tier=")) {
      issue(issues, "error", `${label} data_notes must include source_tier=.`);
    }

    if (["verified", "partial"].includes(row.data_quality_status)) {
      requiredForProduction.forEach((field) => {
        if (!hasValue(row[field])) {
          issue(
            issues,
            "error",
            `${label} is ${row.data_quality_status} but missing ${field}.`
          );
        }
      });
    }

    if (row.data_quality_status === "verified") {
      ["sodium_percent", "magnesium_percent"].forEach((field) => {
        if (!hasValue(row[field])) {
          issue(issues, "error", `${label} is verified but missing ${field}.`);
        }
      });
    }

    if (row.brand && row.name && row.species) {
      const formulaKey = buildFormulaKey(row);
      if (formulaKeys.has(formulaKey)) {
        issue(issues, "error", `${label} duplicates formula key ${formulaKey}.`);
      }
      formulaKeys.add(formulaKey);
    }
  });

  return formulaKeys.size;
}

function validateCsvMirror(jsonRows, csvRows, issues) {
  if (jsonRows.length !== csvRows.length) {
    issue(
      issues,
      "error",
      `JSON master has ${jsonRows.length} rows but CSV mirror has ${csvRows.length}.`
    );
  }
}

function renderReport({ issues, counts }) {
  const now = new Date().toISOString();
  const errors = issues.filter((item) => item.type === "error");
  const warnings = issues.filter((item) => item.type === "warning");
  const status = errors.length === 0 ? "pass" : "fail";

  const issueLines =
    issues.length === 0
      ? ["- No issues found."]
      : issues.map((item) => `- ${item.type.toUpperCase()}: ${item.message}`);

  return [
    "# Foods Dataset Audit",
    "",
    `Generated: ${now}`,
    `Status: ${status}`,
    "",
    "## Counts",
    "",
    `- JSON food rows: ${counts.jsonRows}`,
    `- CSV food rows: ${counts.csvRows}`,
    `- SKU sidecar rows: ${counts.skuRows}`,
    `- Missing photo queue rows: ${counts.missingRows}`,
    `- Photo manifest rows: ${counts.manifestRows}`,
    `- Formula keys: ${counts.formulaKeys}`,
    `- Errors: ${errors.length}`,
    `- Warnings: ${warnings.length}`,
    "",
    "## Issues",
    "",
    ...issueLines,
    "",
  ].join("\n");
}

async function main() {
  const issues = [];
  const counts = {
    jsonRows: 0,
    csvRows: 0,
    skuRows: 0,
    missingRows: 0,
    manifestRows: 0,
    formulaKeys: 0,
  };

  const marketScopeText = await readText(paths.marketScope, issues);
  const qualityRulesText = await readText(paths.qualityRules, issues);
  const jsonMasterText = await readText(paths.jsonMaster, issues);
  const csvMirrorText = await readText(paths.csvMirror, issues);
  const skuMapText = await readText(paths.skuMap, issues);
  const missingPhotoText = await readText(paths.missingPhotoQueue, issues);
  const photoManifestText = await readText(paths.photoManifest, issues);
  const sourceRegistryText = await readText(paths.sourceRegistry, issues);
  const brandPriorityText = await readText(paths.brandPriority, issues);

  let jsonRows = [];
  if (jsonMasterText) {
    try {
      jsonRows = JSON.parse(jsonMasterText);
      if (!Array.isArray(jsonRows)) {
        issue(issues, "error", `${paths.jsonMaster} must contain a JSON array.`);
        jsonRows = [];
      }
    } catch {
      issue(issues, "error", `${paths.jsonMaster} is not valid JSON.`);
    }
  }

  if (marketScopeText) {
    try {
      const marketScope = JSON.parse(marketScopeText);
      if (marketScope.dataset_version !== "euuk_v1") {
        issue(issues, "error", "Market scope dataset_version must be euuk_v1.");
      }
    } catch {
      issue(issues, "error", `${paths.marketScope} is not valid JSON.`);
    }
  }

  if (qualityRulesText) {
    try {
      JSON.parse(qualityRulesText);
    } catch {
      issue(issues, "error", `${paths.qualityRules} is not valid JSON.`);
    }
  }

  const csvMirror = csvMirrorText ? parseCsv(csvMirrorText) : { headers: [], rows: [] };
  const skuMap = skuMapText ? parseCsv(skuMapText) : { headers: [], rows: [] };
  const missingPhoto = missingPhotoText
    ? parseCsv(missingPhotoText)
    : { headers: [], rows: [] };
  const photoManifest = photoManifestText
    ? parseCsv(photoManifestText)
    : { headers: [], rows: [] };
  const sourceRegistry = sourceRegistryText
    ? parseCsv(sourceRegistryText)
    : { headers: [], rows: [] };
  const brandPriority = brandPriorityText
    ? parseCsv(brandPriorityText)
    : { headers: [], rows: [] };

  validateHeaders("csvMirror", csvMirror, issues);
  validateHeaders("skuMap", skuMap, issues);
  validateHeaders("missingPhotoQueue", missingPhoto, issues);
  validateHeaders("photoManifest", photoManifest, issues);
  validateHeaders("sourceRegistry", sourceRegistry, issues);
  validateHeaders("brandPriority", brandPriority, issues);

  counts.jsonRows = jsonRows.length;
  counts.csvRows = csvMirror.rows.length;
  counts.skuRows = skuMap.rows.length;
  counts.missingRows = missingPhoto.rows.length;
  counts.manifestRows = photoManifest.rows.length;
  counts.formulaKeys = validateFoodRows(jsonRows, issues);

  validateCsvMirror(jsonRows, csvMirror.rows, issues);

  if (sourceRegistry.rows.length === 0) {
    issue(issues, "warning", "Source registry has no source rows.");
  }

  const report = renderReport({ issues, counts });
  console.log(report);

  if (WRITE_REPORT) {
    await mkdir(path.dirname(fullPath(paths.report)), { recursive: true });
    await writeFile(fullPath(paths.report), report, "utf8");
  }

  if (issues.some((item) => item.type === "error")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
