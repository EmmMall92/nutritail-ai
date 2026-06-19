import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  dedupeGroups: "data/review/food_v2_source_dedupe_groups.csv",
  output: "data/imports/food_v2_best_candidate_preview.csv",
  report: "reports/food_v2_best_candidate_preview.md",
};

const descriptiveTitlePatterns = [
  /\b(?:dietetic|dietary|complete|complementary)\s+(?:food|feed)\b/i,
  /\b(?:food|feed)\s+for\b/i,
  /\b(?:support|management|treatment|reduction)\s+of\b/i,
  /διαιτητικ[ηή]\s+τροφ[ηή]/iu,
  /κτηνιατρικ[ηή]\s*τροφ[ηή]/iu,
  /τροφ[ηή]\s+για/iu,
  /αντιμετ[ωώ]πιση/iu,
  /υποστ[ηή]ριξη/iu,
  /θεραπε[ιί]α/iu,
  /εν[ηή]λικ[αα]\s+και\s+ηλικιωμ[εέ]να/iu,
];

const packOrOfferPatterns = [
  /\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/iu,
  /\b\d+\s*x\s*\d+(?:[,.]\d+)?\s*(?:kg|g|gr)\b/iu,
  /\b(?:economy\s+pack|saver\s+pack|trial\s+pack|try\s+now|offer|promo|gift)\b/iu,
  /\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\s*(?:free|gratis)\b/iu,
  /\+\s*\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\s*(?:free|gratis)\b/iu,
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
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function templateHeaders(text) {
  return parseCsv(`${text.trimEnd()}\n`).length > 0
    ? Object.keys(parseCsv(`${text.trimEnd()}\n`)[0])
    : text
        .split(/\r?\n/u)[0]
        .replace(/^\uFEFF/u, "")
        .split(",")
        .map((header) => header.trim());
}

async function readImportRows(datasetFile) {
  try {
    const rows = parseCsv(await readFile(path.join(process.cwd(), datasetFile), "utf8"));
    return new Map(rows.map((row) => [row.formula_key, row]));
  } catch {
    return new Map();
  }
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => `- ${key}: ${count}`)
    .join("\n");
}

function renderLimitedRows(rows, renderer, limit = 40) {
  const visibleRows = rows.slice(0, limit);
  const overflow = rows.length - visibleRows.length;
  return [
    ...visibleRows.map(renderer),
    overflow > 0 ? `- ...and ${overflow} more` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const text = await readFile(envPath, "utf8");
    for (const line of text.split(/\r?\n/u)) {
      const match = line.match(/^([^#=]+)=(.*)$/u);
      if (!match) continue;
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = process.env[key] || value;
    }
  } catch {
    // Local CI can provide env vars directly.
  }
}

function renderReport({
  groups,
  exportedRows,
  missingRows,
  skippedExistingRows,
  skippedTitleRiskRows,
  dbCheckEnabled,
}) {
  return `# Food V2 Best Candidate Preview Export

Generated: ${new Date().toISOString()}

## Summary

- Importable best candidate rows exported: ${exportedRows.length}
- Candidate groups considered: ${groups.length}
- Already-imported canonical rows skipped: ${skippedExistingRows.length}
- High title-risk rows skipped: ${skippedTitleRiskRows.length}
- Missing source rows skipped: ${missingRows.length}
- Existing DB canonical check: ${dbCheckEnabled ? "enabled" : "skipped"}
- Output CSV: ${paths.output}

## By Source Priority

${renderCounts(countBy(exportedRows, "source_priority")) || "- none"}

## By Brand

${renderCounts(countBy(exportedRows, "brand")) || "- none"}

## By Dataset

${renderCounts(countBy(exportedRows, "_dataset_file")) || "- none"}

## Already Imported Canonical Rows Skipped

${renderLimitedRows(
  skippedExistingRows,
  (row) => `- ${row.canonical_identity_key}: ${row.best_display_name}`,
  30
) || "- none"}

## High Title-Risk Rows Skipped

${renderLimitedRows(
  skippedTitleRiskRows,
  (item) => `- ${item.group.canonical_identity_key}: ${item.row.display_name} (${item.reason})`,
  30
) || "- none"}

## Operating Rule

This file contains one best candidate row per canonical formula identity. It is intended for Admin Food V2 preview before commit. Alternative rows remain in the dedupe review files as evidence/backfill references.

Rows are skipped from this export when the same canonical food identity already exists in Food V2, even if the old source formula_key is different. This prevents re-importing the same formula from another site, PDF, or pack-size source.

Rows with high title risk are also kept out of this preview. They stay in the review/dedupe reports until their formula_name is replaced with a concise canonical product name.
`;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedDisplayText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value) {
  return normalizedDisplayText(value).split(/\s+/u).filter(Boolean).length;
}

function titleRiskReason(row) {
  const formulaName = normalizedDisplayText(row.formula_name);
  const displayName = normalizedDisplayText(row.display_name);

  if (!formulaName) return "missing_formula_name";
  if (packOrOfferPatterns.some((pattern) => pattern.test(formulaName))) {
    return "formula_contains_pack_or_offer";
  }
  if (wordCount(formulaName) > 10 || formulaName.length > 80) {
    return "formula_name_too_long";
  }
  if (displayName.length > 100) return "display_name_too_long";
  if (descriptiveTitlePatterns.some((pattern) => pattern.test(formulaName))) {
    return "formula_name_looks_like_description";
  }

  return "";
}

function normalizeIdentityText(value) {
  return normalizeText(value)
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/giu, " ")
    .replace(/[^a-z0-9\u0370-\u03ff]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFoodTokenAliases(value) {
  return String(value ?? "")
    .replace(/\u03bc\u03b5/gu, " ")
    .replace(/\u03ba\u03b1\u03b9/gu, " and ")
    .replace(/\u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf/gu, " chicken ")
    .replace(/\u03c7\u03bf\u03b9\u03c1\u03b9\u03bd\u03bf/gu, " pork ")
    .replace(/\u03c0\u03c1\u03bf\u03c3\u03bf\u03c5\u03c4\u03bf/gu, " ham ")
    .replace(/\u03c8\u03b1\u03c1\u03b9/gu, " fish ")
    .replace(/\u03c1\u03c5\u03b6\u03b9/gu, " rice ")
    .replace(/\u03c4\u03bf\u03bd\u03bf\u03c2/gu, " tuna ")
    .replace(/\u03c4\u03bf\u03bd\u03bf/gu, " tuna ")
    .replace(/\u03b1\u03c1\u03bd\u03b9/gu, " lamb ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf\u03c2/gu, " salmon ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf/gu, " salmon ")
    .replace(/\u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9/gu, " beef ")
    .replace(/\u03b2\u03bf\u03b4\u03b9\u03bd\u03bf/gu, " beef ")
    .replace(/\u03c0\u03b1\u03c0\u03b9\u03b1/gu, " duck ")
    .replace(/\u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03c5\u03bb\u03b1/gu, " turkey ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b5\u03c2/gu, " shrimp ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b1/gu, " shrimp ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyBrandFormulaAlias(brand, formula) {
  const brandText = normalizeIdentityText(brand);
  let formulaText = normalizeFoodTokenAliases(normalizeIdentityText(formula));

  if (formulaText.startsWith(`${brandText} `)) {
    formulaText = formulaText.slice(brandText.length + 1).trim();
  }

  if (brandText !== "schesir") return formulaText;

  const aliases = [
    [/^dry medium maintenance(?: chicken)?$/u, "adult medium chicken"],
    [/^adult medium chicken$/u, "adult medium chicken"],
    [/^dry small maintenance(?: dog| chicken)?$/u, "adult small chicken rice"],
    [/^adult small(?: chicken and rice| chicken rice)$/u, "adult small chicken rice"],
    [/^dry kitten(?: chicken)?$/u, "kitten chicken"],
    [/^kitten chicken$/u, "kitten chicken"],
    [/^cat sterilized and light(?: chicken)?$/u, "sterilized light chicken"],
    [/^sterili[sz]ed cat chicken$/u, "sterilized light chicken"],
    [/^sterili[sz]ed light(?: chicken)?$/u, "sterilized light chicken"],
  ];

  for (const [pattern, replacement] of aliases) {
    if (pattern.test(formulaText)) return replacement;
  }

  return formulaText;
}

function canonicalIdentityKey({ brand, formula_name, species, format }) {
  const brandText = normalizeIdentityText(brand);
  const formulaText = applyBrandFormulaAlias(brand, formula_name);

  return [brandText, formulaText, normalizeIdentityText(species), normalizeIdentityText(format)]
    .filter(Boolean)
    .join("|");
}

function normalizeGroupIdentityKey(value) {
  const parts = String(value ?? "").split("|");
  if (parts.length !== 4) return normalizeIdentityText(value);
  return [
    normalizeIdentityText(parts[0]),
    normalizeFoodTokenAliases(normalizeIdentityText(parts[1])),
    normalizeIdentityText(parts[2]),
    normalizeIdentityText(parts[3]),
  ]
    .filter(Boolean)
    .join("|");
}

async function loadExistingCanonicalKeys() {
  await loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { enabled: false, keys: new Set() };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("food_products_v2")
    .select("brand, formula_name, species, format");

  if (error) throw error;

  return {
    enabled: true,
    keys: new Set((data ?? []).map((row) => canonicalIdentityKey(row))),
  };
}

function applyPreviewTitleAliases(row, group) {
  if (normalizeText(row.brand) !== "schesir") return row;

  const key = group.canonical_identity_key;
  const aliases = {
    "schesir|adult medium chicken|dog|dry": {
      formula_name: "Adult Medium Chicken",
      display_name: "Schesir Adult Medium Chicken",
      dog_size: "medium",
    },
    "schesir|adult small chicken rice|dog|dry": {
      formula_name: "Adult Small Chicken & Rice",
      display_name: "Schesir Adult Small Chicken & Rice",
      dog_size: "small",
    },
    "schesir|kitten chicken|cat|dry": {
      formula_name: "Kitten Chicken",
      display_name: "Schesir Kitten Chicken",
    },
    "schesir|sterilized light chicken|cat|dry": {
      formula_name: "Sterilized Light Chicken",
      display_name: "Schesir Sterilized Light Chicken",
    },
  };

  const alias = aliases[key];
  if (!alias) return row;

  return {
    ...row,
    ...alias,
    source_notes: [
      row.source_notes,
      `preview_title_alias_applied=${alias.display_name}`,
    ]
      .filter(Boolean)
      .join("; "),
  };
}

async function main() {
  const headers = templateHeaders(await readFile(paths.template, "utf8"));
  const dedupeGroups = parseCsv(await readFile(paths.dedupeGroups, "utf8"));
  const candidateGroups = dedupeGroups.filter((row) => row.best_decision === "candidate");
  const existingCanonical = await loadExistingCanonicalKeys();
  const datasetFiles = [...new Set(candidateGroups.map((row) => row.best_dataset_file))];
  const rowsByDataset = new Map();

  for (const datasetFile of datasetFiles) {
    rowsByDataset.set(datasetFile, await readImportRows(datasetFile));
  }

  const missingRows = [];
  const skippedExistingRows = [];
  const skippedTitleRiskRows = [];
  const exportedRows = [];

  for (const group of candidateGroups) {
    const groupCanonicalKey = normalizeGroupIdentityKey(group.canonical_identity_key);
    if (existingCanonical.keys.has(groupCanonicalKey)) {
      skippedExistingRows.push(group);
      continue;
    }

    const sourceRows = rowsByDataset.get(group.best_dataset_file);
    const sourceRow = sourceRows?.get(group.best_formula_key);
    if (!sourceRow) {
      missingRows.push(group);
      continue;
    }

    const aliasedSourceRow = applyPreviewTitleAliases(sourceRow, group);
    const riskReason = titleRiskReason(aliasedSourceRow);
    if (riskReason) {
      skippedTitleRiskRows.push({ group, row: aliasedSourceRow, reason: riskReason });
      continue;
    }

    const exportedRow = Object.fromEntries(
      headers.map((header) => [header, aliasedSourceRow[header] ?? ""])
    );
    exportedRow._dataset_file = group.best_dataset_file;
    exportedRows.push(exportedRow);
  }

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, exportedRows), "utf8");
  await writeFile(
    paths.report,
    renderReport({
      groups: candidateGroups,
      exportedRows,
      missingRows,
      skippedExistingRows,
      skippedTitleRiskRows,
      dbCheckEnabled: existingCanonical.enabled,
    }),
    "utf8"
  );

  console.log(`Food V2 best candidate rows exported: ${exportedRows.length}`);
  console.log(`Already-imported canonical rows skipped: ${skippedExistingRows.length}`);
  console.log(`High title-risk rows skipped: ${skippedTitleRiskRows.length}`);
  console.log(`Missing source rows skipped: ${missingRows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
