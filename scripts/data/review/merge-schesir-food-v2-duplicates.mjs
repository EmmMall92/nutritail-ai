import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const EXECUTE = process.argv.includes("--execute");

const paths = {
  csv: "data/review/schesir_food_v2_db_merge_cleanup.csv",
  report: "reports/schesir_food_v2_db_merge_cleanup.md",
};

const duplicatePairs = [
  {
    canonicalKey: "schesir|adult-medium-chicken|dog|dry",
    keepFormulaKey: "schesir|adult-medium-chicken|dog|dry",
    duplicateFormulaKey: "schesir-dry-medium-maintenance-chicken-dog-dry-gr-document",
  },
  {
    canonicalKey: "schesir|kitten-chicken|cat|dry",
    keepFormulaKey: "schesir|kitten-chicken|cat|dry",
    duplicateFormulaKey: "schesir-dry-kitten-cat-dry-gr-document",
  },
  {
    canonicalKey: "schesir|sterilized-light-chicken|cat|dry",
    keepFormulaKey: "schesir|sterilized-light-chicken|cat|dry",
    duplicateFormulaKey: "schesir-cat-sterilized-light-cat-dry-gr-document",
  },
];

const headers = [
  "mode",
  "canonical_key",
  "status",
  "keep_formula_key",
  "keep_id",
  "duplicate_formula_key",
  "duplicate_id",
  "sources_copied",
  "sources_skipped",
  "notes_updated",
  "duplicate_deleted",
  "details",
];

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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function splitNotes(value) {
  return String(value ?? "")
    .split(";")
    .map((note) => note.trim())
    .filter(Boolean);
}

function mergeNotes(keepRow, duplicateRow) {
  const notes = new Set([
    ...splitNotes(keepRow.source_notes),
    ...splitNotes(duplicateRow.source_notes),
    `merged_duplicate_formula_key=${duplicateRow.formula_key}`,
  ]);
  return [...notes].join("; ");
}

async function fetchProduct(supabase, formulaKey) {
  const { data, error } = await supabase
    .from("food_products_v2")
    .select("*")
    .eq("formula_key", formulaKey)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function fetchSources(supabase, productId) {
  const { data, error } = await supabase
    .from("food_product_sources_v2")
    .select("*")
    .eq("food_product_id", productId);

  if (error) throw error;
  return data ?? [];
}

function sourceIdentity(source) {
  return [
    String(source.source_url ?? "").trim().toLowerCase(),
    String(source.source_type ?? "").trim().toLowerCase(),
    String(source.source_priority ?? "").trim().toLowerCase(),
  ].join("|");
}

function sourceInsertPayload(source, keepProductId) {
  return {
    food_product_id: keepProductId,
    source_url: source.source_url,
    source_type: source.source_type,
    source_priority: source.source_priority,
    raw_text: source.raw_text,
    raw_json: {
      ...(source.raw_json && typeof source.raw_json === "object" ? source.raw_json : {}),
      merged_from_product_id: source.food_product_id,
      merged_at: new Date().toISOString(),
      merge_reason: "schesir_duplicate_food_v2_cleanup",
    },
    extracted_at: source.extracted_at,
  };
}

async function mergePair(supabase, pair) {
  const keepRow = await fetchProduct(supabase, pair.keepFormulaKey);
  const duplicateRow = await fetchProduct(supabase, pair.duplicateFormulaKey);

  if (!keepRow || !duplicateRow) {
    return {
      mode: EXECUTE ? "execute" : "dry_run",
      canonical_key: pair.canonicalKey,
      status: "skipped_missing_row",
      keep_formula_key: pair.keepFormulaKey,
      keep_id: keepRow?.id ?? "",
      duplicate_formula_key: pair.duplicateFormulaKey,
      duplicate_id: duplicateRow?.id ?? "",
      sources_copied: 0,
      sources_skipped: 0,
      notes_updated: false,
      duplicate_deleted: false,
      details: !keepRow ? "Missing canonical keep row." : "Duplicate already absent.",
    };
  }

  if (keepRow.id === duplicateRow.id) {
    return {
      mode: EXECUTE ? "execute" : "dry_run",
      canonical_key: pair.canonicalKey,
      status: "skipped_same_row",
      keep_formula_key: pair.keepFormulaKey,
      keep_id: keepRow.id,
      duplicate_formula_key: pair.duplicateFormulaKey,
      duplicate_id: duplicateRow.id,
      sources_copied: 0,
      sources_skipped: 0,
      notes_updated: false,
      duplicate_deleted: false,
      details: "Keep and duplicate resolved to the same row.",
    };
  }

  const [keepSources, duplicateSources] = await Promise.all([
    fetchSources(supabase, keepRow.id),
    fetchSources(supabase, duplicateRow.id),
  ]);
  const keepSourceIds = new Set(keepSources.map(sourceIdentity));
  const sourcesToCopy = duplicateSources.filter((source) => !keepSourceIds.has(sourceIdentity(source)));
  const mergedNotes = mergeNotes(keepRow, duplicateRow);
  const notesUpdated = mergedNotes !== String(keepRow.source_notes ?? "");

  if (EXECUTE) {
    if (sourcesToCopy.length > 0) {
      const { error } = await supabase
        .from("food_product_sources_v2")
        .insert(sourcesToCopy.map((source) => sourceInsertPayload(source, keepRow.id)));
      if (error) throw error;
    }

    const productPatch = {
      source_notes: mergedNotes,
      is_recommendable: Boolean(keepRow.is_recommendable || duplicateRow.is_recommendable),
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from("food_products_v2")
      .update(productPatch)
      .eq("id", keepRow.id);
    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("food_products_v2")
      .delete()
      .eq("id", duplicateRow.id)
      .eq("formula_key", pair.duplicateFormulaKey);
    if (deleteError) throw deleteError;
  }

  return {
    mode: EXECUTE ? "execute" : "dry_run",
    canonical_key: pair.canonicalKey,
    status: EXECUTE ? "merged_duplicate" : "would_merge_duplicate",
    keep_formula_key: keepRow.formula_key,
    keep_id: keepRow.id,
    duplicate_formula_key: duplicateRow.formula_key,
    duplicate_id: duplicateRow.id,
    sources_copied: sourcesToCopy.length,
    sources_skipped: duplicateSources.length - sourcesToCopy.length,
    notes_updated: notesUpdated,
    duplicate_deleted: EXECUTE,
    details: `${duplicateRow.display_name} -> ${keepRow.display_name}`,
  };
}

function renderReport(rows) {
  const merged = rows.filter((row) => row.status === "merged_duplicate").length;
  const dryRun = rows.filter((row) => row.status === "would_merge_duplicate").length;
  const skipped = rows.filter((row) => row.status.startsWith("skipped")).length;

  return `# Schesir Food V2 DB Merge Cleanup

Generated: ${new Date().toISOString()}
Mode: ${EXECUTE ? "execute" : "dry_run"}

## Summary

- Pairs configured: ${duplicatePairs.length}
- Duplicates merged: ${merged}
- Duplicates that would be merged: ${dryRun}
- Skipped: ${skipped}
- Cleanup CSV: ${paths.csv}

## Scope

This script only handles the three Schesir duplicate pairs that were identified by the prior DB audit. It keeps the cleaner canonical Food V2 row, copies any missing source evidence from the older duplicate row, appends a merge note, and then deletes only the older duplicate product row in execute mode.

## Results

${rows
  .map(
    (row) =>
      `- ${row.status}: ${row.duplicate_formula_key} -> ${row.keep_formula_key} (sources copied: ${row.sources_copied}, skipped: ${row.sources_skipped})`
  )
  .join("\n")}
`;
}

async function main() {
  await loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rows = [];
  for (const pair of duplicatePairs) {
    rows.push(await mergePair(supabase, pair));
  }

  await mkdir(path.dirname(paths.csv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csv, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Mode: ${EXECUTE ? "execute" : "dry_run"}`);
  console.log(`Pairs processed: ${rows.length}`);
  console.log(`Wrote ${paths.csv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
