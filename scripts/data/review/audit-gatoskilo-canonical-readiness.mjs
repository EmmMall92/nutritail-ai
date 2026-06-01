import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  gatoskiloCsv: "data/imports/gatoskilo_local_html_batch_v2.csv",
  importsDir: "data/imports",
  duplicateCsv: "data/review/gatoskilo_canonical_duplicate_review.csv",
  estimatedKcalCsv: "data/review/gatoskilo_estimated_kcal_review.csv",
  backfillCsv: "data/review/gatoskilo_backfill_review.csv",
  report: "reports/gatoskilo_canonical_readiness_audit.md",
};

const PACK_SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:g|gr|gram|grams|kg|kgs|kilogram|kilograms|lb|lbs)\b/gi;

const SOURCE_SUFFIX_PATTERN =
  /(?:^|[-_\s|])(?:official|retailer|document|spreadsheet|pdf|ods|html|mhtml|photo|manual|source|gatoskilo|petshop88|zooplus|petsamolis|royal-canin-gr|gr|eu|uk)(?=$|[-_\s|])/gi;

const NOISE_WORDS = [
  "dry dog food",
  "dog dry food",
  "dry food",
  "xira trofi skylou",
  "ksira trofi skylou",
  "trofi skylou",
  "trofes skylon",
  "for dogs",
  "dogs",
  "dog",
  "skylou",
  "skylos",
  "gamma",
  "eshop",
];

const duplicateHeaders = [
  "canonical_formula_key",
  "gatoskilo_formula_key",
  "gatoskilo_brand",
  "gatoskilo_formula_name",
  "gatoskilo_source_url",
  "matched_dataset_file",
  "matched_formula_key",
  "matched_brand",
  "matched_formula_name",
  "match_type",
  "gatoskilo_kcal_source",
  "matched_kcal_source",
  "recommended_action",
];

const estimatedHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "format",
  "kcal_per_100g",
  "kcal_per_kg",
  "calculation_note",
  "source_url",
  "recommended_action",
];

const backfillHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "missing_fields",
  "source_url",
  "recommended_action",
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

  const headers = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeNoiseWords(value) {
  let cleaned = value;
  for (const word of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }
  return cleaned;
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9α-ω]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeFormula(value) {
  return removeNoiseWords(String(value ?? ""))
    .replace(PACK_SIZE_PATTERN, " ")
    .replace(SOURCE_SUFFIX_PATTERN, " ")
    .replace(/[|_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalKey(row) {
  return [
    slugify(row.brand),
    slugify(normalizeFormula(row.formula_name)),
    slugify(row.species || "unknown"),
    slugify(row.format || "unknown"),
  ]
    .filter(Boolean)
    .join("|");
}

function tokenSet(row) {
  const ignored = new Set([
    normalizeText(row.brand),
    "dog",
    "cat",
    "dry",
    "adult",
    "puppy",
    "junior",
    "food",
    "with",
    "and",
    "the",
  ]);
  return new Set(
    normalizeText(row.formula_name)
      .split(/[^a-z0-9α-ω]+/iu)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !ignored.has(token))
  );
}

function jaccard(a, b) {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / union.size;
}

function lifeStageSignal(value) {
  const text = normalizeText(value);
  if (/\b(puppy|junior|kitten)\b/u.test(text)) return "growth";
  if (/\b(senior|mature|maturity|7|8)\b/u.test(text)) return "senior";
  if (/\b(adult)\b/u.test(text)) return "adult";
  return "";
}

function hasLifeStageConflict(a, b) {
  const left = lifeStageSignal(a.formula_name);
  const right = lifeStageSignal(b.formula_name);
  return Boolean(left && right && left !== right);
}

function kcalSource(row) {
  const notes = String(row.source_notes ?? "");
  if (notes.includes("label_energy_used=true")) return "label";
  if (notes.includes("kcal_estimated=true")) return "estimated";
  if (row.kcal_per_100g || row.kcal_per_kg) return "present_unknown";
  return "missing";
}

function missingFields(row) {
  const required = [
    "brand",
    "formula_name",
    "species",
    "format",
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "kcal_per_100g",
    "data_source_url",
  ];
  return required.filter((field) => !String(row[field] ?? "").trim());
}

async function readFoodV2ImportFiles() {
  const files = (await readdir(paths.importsDir))
    .filter((file) => file.endsWith(".csv"))
    .map((file) => path.join(paths.importsDir, file));

  const datasets = [];
  for (const file of files) {
    const rows = parseCsv(await readFile(file, "utf8"));
    if (
      rows.some(
        (row) =>
          row.formula_key &&
          row.brand &&
          row.formula_name &&
          row.species &&
          row.format
      )
    ) {
      datasets.push({
        file: file.replace(/\\/g, "/"),
        rows,
      });
    }
  }
  return datasets;
}

function findDuplicateCandidates(gatoskiloRows, datasets) {
  const duplicateRows = [];
  const allOtherRows = datasets
    .filter((dataset) => dataset.file !== paths.gatoskiloCsv)
    .flatMap((dataset) =>
      dataset.rows.map((row) => ({
        datasetFile: dataset.file,
        row,
        canonical: canonicalKey(row),
        tokens: tokenSet(row),
      }))
    );

  for (const gatoskilo of gatoskiloRows) {
    const gCanonical = canonicalKey(gatoskilo);
    const gTokens = tokenSet(gatoskilo);
    const exact = allOtherRows.filter(
      (candidate) => candidate.canonical === gCanonical
    );
    const fuzzy = exact.length
      ? []
      : allOtherRows
          .map((candidate) => ({
            ...candidate,
            score: jaccard(gTokens, candidate.tokens),
          }))
          .filter(
            (candidate) =>
              candidate.score >= 0.72 &&
              normalizeText(candidate.row.brand) === normalizeText(gatoskilo.brand) &&
              candidate.row.species === gatoskilo.species &&
              candidate.row.format === gatoskilo.format &&
              !hasLifeStageConflict(gatoskilo, candidate.row)
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);

    for (const match of exact.slice(0, 3)) {
      duplicateRows.push({
        canonical_formula_key: gCanonical,
        gatoskilo_formula_key: gatoskilo.formula_key,
        gatoskilo_brand: gatoskilo.brand,
        gatoskilo_formula_name: gatoskilo.formula_name,
        gatoskilo_source_url: gatoskilo.data_source_url,
        matched_dataset_file: match.datasetFile,
        matched_formula_key: match.row.formula_key,
        matched_brand: match.row.brand,
        matched_formula_name: match.row.formula_name,
        match_type: "exact_canonical",
        gatoskilo_kcal_source: kcalSource(gatoskilo),
        matched_kcal_source: kcalSource(match.row),
        recommended_action:
          "Review source priority and merge as one formula; keep stronger kcal/ash evidence.",
      });
    }

    for (const match of fuzzy) {
      duplicateRows.push({
        canonical_formula_key: gCanonical,
        gatoskilo_formula_key: gatoskilo.formula_key,
        gatoskilo_brand: gatoskilo.brand,
        gatoskilo_formula_name: gatoskilo.formula_name,
        gatoskilo_source_url: gatoskilo.data_source_url,
        matched_dataset_file: match.datasetFile,
        matched_formula_key: match.row.formula_key,
        matched_brand: match.row.brand,
        matched_formula_name: match.row.formula_name,
        match_type: `fuzzy_${match.score.toFixed(2)}`,
        gatoskilo_kcal_source: kcalSource(gatoskilo),
        matched_kcal_source: kcalSource(match.row),
        recommended_action:
          "Manual duplicate review before import; names are similar but not exact.",
      });
    }
  }

  return duplicateRows;
}

async function main() {
  const datasets = await readFoodV2ImportFiles();
  const gatoskiloDataset = datasets.find(
    (dataset) => dataset.file === paths.gatoskiloCsv
  );
  if (!gatoskiloDataset) {
    throw new Error(`Missing ${paths.gatoskiloCsv}`);
  }

  const gatoskiloRows = gatoskiloDataset.rows;
  const duplicateRows = findDuplicateCandidates(gatoskiloRows, datasets);
  const estimatedKcalRows = gatoskiloRows
    .filter((row) => kcalSource(row) === "estimated")
    .map((row) => ({
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      format: row.format,
      kcal_per_100g: row.kcal_per_100g,
      kcal_per_kg: row.kcal_per_kg,
      calculation_note:
        String(row.source_notes ?? "")
          .split(";")
          .map((note) => note.trim())
          .filter((note) => note.startsWith("kcal_") || note.startsWith("estimated_"))
          .join("; ") || "kcal_estimated=true",
      source_url: row.data_source_url,
      recommended_action:
        "Keep as review-safe estimate until official label kcal is found.",
    }));
  const backfillRows = gatoskiloRows
    .map((row) => ({
      row,
      missing: missingFields(row),
    }))
    .filter((item) => item.missing.length > 0)
    .map(({ row, missing }) => ({
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      missing_fields: missing.join("|"),
      source_url: row.data_source_url,
      recommended_action:
        "Backfill from official page, label photo, or trusted retailer source before import.",
    }));

  await mkdir(path.dirname(paths.duplicateCsv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.duplicateCsv, writeCsv(duplicateHeaders, duplicateRows), "utf8");
  await writeFile(paths.estimatedKcalCsv, writeCsv(estimatedHeaders, estimatedKcalRows), "utf8");
  await writeFile(paths.backfillCsv, writeCsv(backfillHeaders, backfillRows), "utf8");

  const exactDuplicates = duplicateRows.filter(
    (row) => row.match_type === "exact_canonical"
  ).length;
  const fuzzyDuplicates = duplicateRows.length - exactDuplicates;
  const labelKcalRows = gatoskiloRows.filter((row) => kcalSource(row) === "label").length;

  await writeFile(
    paths.report,
    [
      "# Gatoskilo Canonical Readiness Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Gatoskilo formula rows: ${gatoskiloRows.length}`,
      `- Potential duplicate matches: ${duplicateRows.length}`,
      `- Exact canonical duplicate matches: ${exactDuplicates}`,
      `- Fuzzy duplicate matches: ${fuzzyDuplicates}`,
      `- Label kcal rows: ${labelKcalRows}`,
      `- Estimated kcal rows: ${estimatedKcalRows.length}`,
      `- Backfill rows: ${backfillRows.length}`,
      "",
      "## Outputs",
      "",
      `- ${paths.duplicateCsv}`,
      `- ${paths.estimatedKcalCsv}`,
      `- ${paths.backfillCsv}`,
      "",
      "## Recommended Next Step",
      "",
      "Review exact/fuzzy duplicates before importing a large Gatoskilo batch. Keep label kcal/ash over estimated values, and use the estimated kcal queue as a follow-up source search list.",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        gatoskiloRows: gatoskiloRows.length,
        duplicateRows: duplicateRows.length,
        exactDuplicates,
        fuzzyDuplicates,
        labelKcalRows,
        estimatedKcalRows: estimatedKcalRows.length,
        backfillRows: backfillRows.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
