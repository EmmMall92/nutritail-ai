import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  raw: "data/raw/ambrosia/ambrosia-products-el.json",
  jsonMaster: "data/imports/nutritail_foods_euuk_v1.json",
  csvReview: "data/review/ambrosia_import_review.csv",
  report: "reports/ambrosia_import_review.md",
};

const headers = [
  "title",
  "source_url",
  "candidate_species",
  "candidate_form",
  "candidate_life_stages",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "calcium_percent",
  "phosphorus_percent",
  "canonical_status",
  "review_reason",
  "recommended_next_step",
];

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function inferReview(product, importedUrls) {
  if (importedUrls.has(product.source_url)) {
    return {
      canonical_status: "imported_partial",
      review_reason: "Imported as partial official-source row; sodium and magnesium are not published on the official page.",
      recommended_next_step: "Backfill sodium_percent and magnesium_percent from official sheet or label photo.",
    };
  }

  if (product.kcal_per_100g == null) {
    return {
      canonical_status: "not_imported",
      review_reason: "Missing kcal_per_100g on the official page extraction.",
      recommended_next_step: "Check official page manually, official PDF, or Greek label photo for metabolizable energy.",
    };
  }

  if (!product.candidate_species) {
    return {
      canonical_status: "not_imported",
      review_reason: "Species could not be inferred confidently from the current parser.",
      recommended_next_step: "Manually review breadcrumb, feeding guide, and pack image before import.",
    };
  }

  if (product.candidate_species !== "dog") {
    return {
      canonical_status: "not_imported",
      review_reason: "Current canonical Ambrosia batch intentionally imported dog dry rows only.",
      recommended_next_step: "Normalize in a dedicated cat-food batch after confirming cat schema assumptions.",
    };
  }

  if (product.candidate_form !== "dry") {
    return {
      canonical_status: "not_imported",
      review_reason: "Current canonical Ambrosia batch intentionally imported dry rows only.",
      recommended_next_step: "Normalize wet food separately after moisture/dry-matter handling is reviewed.",
    };
  }

  return {
    canonical_status: "not_imported",
    review_reason: product.missing_core_fields?.length
      ? `Missing core fields: ${product.missing_core_fields.join(", ")}.`
      : "Excluded by conservative batch filter.",
    recommended_next_step: "Manually review before canonical import.",
  };
}

async function main() {
  const raw = JSON.parse(await readFile(paths.raw, "utf8"));
  const foods = JSON.parse(await readFile(paths.jsonMaster, "utf8"));
  const importedUrls = new Set(
    foods
      .filter((row) => row.brand === "Ambrosia")
      .map((row) => row.data_source_url),
  );

  const rows = raw.products.map((product) => ({
    title: product.title,
    source_url: product.source_url,
    candidate_species: product.candidate_species,
    candidate_form: product.candidate_form,
    candidate_life_stages: product.candidate_life_stages,
    kcal_per_100g: product.kcal_per_100g,
    protein_percent: product.protein_percent,
    fat_percent: product.fat_percent,
    fiber_percent: product.fiber_percent,
    calcium_percent: product.calcium_percent,
    phosphorus_percent: product.phosphorus_percent,
    ...inferReview(product, importedUrls),
  }));

  const statusCounts = rows.reduce((counts, row) => {
    counts[row.canonical_status] = (counts[row.canonical_status] ?? 0) + 1;
    return counts;
  }, {});
  const reasonCounts = rows.reduce((counts, row) => {
    counts[row.review_reason] = (counts[row.review_reason] ?? 0) + 1;
    return counts;
  }, {});

  await mkdir(path.dirname(paths.csvReview), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csvReview, writeCsv(rows), "utf8");

  const report = [
    "# Ambrosia Import Review",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Raw official Ambrosia product pages: ${raw.products.length}`,
    `- Canonical Ambrosia rows imported: ${statusCounts.imported_partial ?? 0}`,
    `- Rows still requiring review: ${statusCounts.not_imported ?? 0}`,
    "",
    "## Review Reasons",
    "",
    ...Object.entries(reasonCounts).map(([reason, count]) => `- ${count}: ${reason}`),
    "",
    "## Next Steps",
    "",
    "- Backfill sodium and magnesium for imported rows from official sheets or label photos.",
    "- Manually review species for ambiguous rows before import.",
    "- Handle wet and cat foods in separate batches so nutrition assumptions stay clear.",
    "",
  ].join("\n");

  await writeFile(paths.report, report, "utf8");
  console.log(`Wrote ${paths.csvReview}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
