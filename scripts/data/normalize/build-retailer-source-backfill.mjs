import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const importFiles = [
  "data/imports/acana_document_extract_v2.csv",
  "data/imports/orijen_document_extract_v2.csv",
  "data/imports/schesir_dry_document_extract_v2.csv",
  "data/imports/gheda_schesir_spreadsheet_extract_v2.csv",
  "data/imports/schesir_gheda_marketplace_ods_extract_v2.csv",
  "data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv",
  "data/imports/mixed_eshop_spreadsheet_extract_v2.csv",
];

const sourceFiles = [
  "data/sources/schesir_royal_link_registry.csv",
  "data/review/purina_official_enrichment_candidates.csv",
];

const outputPaths = {
  importCsv: "data/imports/retailer_source_backfill_v2.csv",
  reviewCsv: "data/review/retailer_source_backfill_review.csv",
  report: "reports/retailer_source_backfill.md",
};

const acceptedSourceGroups = [
  "aigan retailer",
  "kompa distributor",
  "gatoskilo retailer",
  "petshop88 retailer",
  "pet-it retailer",
  "petcity retailer",
  "petsamolis retailer",
  "zooplus retailer",
  "schesir official",
  "purina official",
];

const packageTokens = new Set([
  "400g",
  "255g",
  "1kg",
  "1.5kg",
  "10kg",
  "12kg",
  "2kg",
  "3kg",
  "4kg",
  "7kg",
  "kg",
  "g",
]);

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
  return {
    headers,
    rows: rows.slice(1).map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
    ),
  };
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
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9α-ω]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensFor(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 3 &&
        !packageTokens.has(token) &&
        !["dog", "cat", "dry", "adult", "with", "and", "the"].includes(token)
    );
}

function sourcePriorityFor(source) {
  const group = String(source.source_group ?? "").toLowerCase();
  const tier = String(source.source_tier ?? "").toLowerCase();
  if (tier === "official" || group.includes("official")) return "official";
  return "retailer";
}

function sourceNotesFor(row, source, score) {
  const base = String(row.source_notes ?? "")
    .replace(/official_url_required=true;?\s*/g, "")
    .replace(/verify against official source or label before import\.;?\s*/gi, "");
  return [
    base,
    "source_tier=retailer_or_official_backfill",
    `backfill_source_group=${source.source_group ?? ""}`,
    `backfill_match_score=${score.toFixed(2)}`,
    "retailer_sources_accepted_for_needs_review=true",
    "human_qa_required_before_recommendation=true",
  ]
    .filter(Boolean)
    .join("; ");
}

function loadSourceCandidates(parsedFiles) {
  return parsedFiles
    .flatMap(({ rows }) => rows)
    .filter((row) => {
      const group = String(row.source_group ?? "").toLowerCase();
      const url = String(row.product_url ?? "").trim();
      return (
        url &&
        acceptedSourceGroups.some((accepted) => group.includes(accepted)) &&
        String(row.product_scope ?? "complete_food_candidate").includes("complete_food")
      );
    })
    .map((row) => ({
      ...row,
      source_group: row.source_group ?? "",
      product_url: row.product_url ?? "",
      brand_guess: row.brand_guess || row.brand || "",
      title: row.product_title || row.formula_name_guess || "",
      tokens: tokensFor(`${row.brand_guess ?? ""} ${row.product_title ?? ""} ${row.formula_name_guess ?? ""}`),
    }))
    .filter((row) => row.tokens.length > 0);
}

function matchScore(row, source) {
  const rowBrand = normalizeText(row.brand);
  const sourceBrand = normalizeText(source.brand_guess);
  if (sourceBrand && rowBrand && sourceBrand !== rowBrand) return 0;

  const sourceText = normalizeText(
    `${source.listing_url ?? ""} ${source.product_url ?? ""} ${source.title ?? ""}`
  );
  const rowText = normalizeText(`${row.species ?? ""} ${row.format ?? ""} ${row.formula_name ?? ""}`);
  if (row.species === "cat" && /\bdog\b/.test(sourceText)) return 0;
  if (row.species === "dog" && /\bcat\b/.test(sourceText)) return 0;
  if (row.format === "wet" && /\bdry\b/.test(sourceText)) return 0;
  if (row.format === "dry" && /\bwet\b/.test(sourceText)) return 0;
  if (/\bwet\b/.test(rowText) && /\bdry\b/.test(sourceText)) return 0;

  const rowTokens = new Set(tokensFor(`${row.brand} ${row.formula_name} ${row.display_name}`));
  if (rowTokens.size === 0) return 0;
  const brandTokens = new Set(tokensFor(row.brand));
  const matches = source.tokens.filter((token) => rowTokens.has(token));
  const formulaMatches = matches.filter((token) => !brandTokens.has(token));
  if (formulaMatches.length === 0) return 0;
  const overlap = matches.length / Math.max(source.tokens.length, rowTokens.size);
  const strongTokenBonus = formulaMatches.some((token) => token.length >= 6) ? 0.08 : 0;
  return overlap + strongTokenBonus;
}

function findBestSource(row, sources) {
  const ranked = sources
    .map((source) => ({ source, score: matchScore(row, source) }))
    .filter((item) => item.score >= 0.34)
    .sort((a, b) => b.score - a.score);
  return ranked[0] ?? null;
}

async function readMaybeCsv(file) {
  try {
    return { file, ...parseCsv(await readFile(file, "utf8")) };
  } catch {
    return { file, headers: [], rows: [] };
  }
}

function hasCoreNutrition(row) {
  return row.protein_percent && row.fat_percent && row.fiber_percent;
}

async function main() {
  const imports = await Promise.all(importFiles.map(readMaybeCsv));
  const sources = loadSourceCandidates(await Promise.all(sourceFiles.map(readMaybeCsv)));
  const outputRows = [];
  const reviewRows = [];
  const seen = new Set();

  for (const file of imports) {
    for (const row of file.rows) {
      if (row.data_source_url || !hasCoreNutrition(row)) continue;
      const best = findBestSource(row, sources);
      if (!best) continue;
      const key = row.formula_key;
      if (seen.has(key)) continue;
      seen.add(key);

      const sourcePriority = sourcePriorityFor(best.source);
      outputRows.push({
        ...row,
        data_quality_status: "needs_review",
        data_source_url: best.source.product_url,
        source_priority: sourcePriority,
        source_notes: sourceNotesFor(row, best.source, best.score),
      });
      reviewRows.push({
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        species: row.species,
        format: row.format,
        source_url: best.source.product_url,
        source_group: best.source.source_group,
        source_priority: sourcePriority,
        match_score: best.score.toFixed(2),
        still_missing: [
          row.kcal_per_100g || row.kcal_per_kg ? "" : "kcal_per_100g_or_kcal_per_kg",
          row.data_source_url ? "" : "",
        ]
          .filter(Boolean)
          .join("|"),
        recommended_next_step: row.kcal_per_100g || row.kcal_per_kg
          ? "Preview in admin; retailer/official source is attached for needs_review QA."
          : "Use attached retailer/official source to backfill calories before import.",
      });
    }
  }

  const headers = imports.find((file) => file.headers.length > 0)?.headers ?? [];
  const reviewHeaders = [
    "formula_key",
    "brand",
    "formula_name",
    "species",
    "format",
    "source_url",
    "source_group",
    "source_priority",
    "match_score",
    "still_missing",
    "recommended_next_step",
  ];

  await mkdir(path.dirname(outputPaths.importCsv), { recursive: true });
  await mkdir(path.dirname(outputPaths.reviewCsv), { recursive: true });
  await mkdir(path.dirname(outputPaths.report), { recursive: true });
  await writeFile(outputPaths.importCsv, writeCsv(headers, outputRows), "utf8");
  await writeFile(outputPaths.reviewCsv, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(
    outputPaths.report,
    `# Retailer Source Backfill\n\nGenerated: ${new Date().toISOString()}\n\n- Backfilled rows: ${outputRows.length}\n- Review CSV: ${outputPaths.reviewCsv}\n- Import CSV: ${outputPaths.importCsv}\n\nRetailer/distributor sources are valid provenance for needs_review rows. They do not make rows verified and they do not outrank official manufacturer evidence.\n`,
    "utf8"
  );

  console.log(`Retailer source backfill rows: ${outputRows.length}`);
  console.log(`Wrote ${outputPaths.importCsv}`);
  console.log(`Wrote ${outputPaths.reviewCsv}`);
  console.log(`Wrote ${outputPaths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
