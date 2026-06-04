import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const paths = {
  csv: "data/review/schesir_food_v2_db_cleanup.csv",
  report: "reports/schesir_food_v2_db_cleanup.md",
};

const headers = [
  "canonical_key",
  "row_count",
  "recommended_action",
  "keep_formula_key",
  "formula_key",
  "display_name",
  "formula_name",
  "species",
  "format",
  "source_priority",
  "data_quality_status",
  "updated_at",
];

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  return readFile(envPath, "utf8")
    .then((text) => {
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
    })
    .catch(() => {});
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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/&/g, " and ")
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
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/giu, " ")
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applySchesirAlias(formulaName) {
  let text = normalizeText(formulaName);
  if (text.startsWith("schesir ")) text = text.slice("schesir ".length).trim();

  const aliases = [
    [/^dry medium maintenance(?: chicken)?$/u, "adult medium chicken"],
    [/^adult medium(?: chicken)?$/u, "adult medium chicken"],
    [/^dry small maintenance(?: dog| chicken)?$/u, "adult small chicken rice"],
    [/^adult small(?: chicken and rice| chicken rice)?$/u, "adult small chicken rice"],
    [/^dry kitten(?: chicken)?$/u, "kitten chicken"],
    [/^kitten(?: chicken)?$/u, "kitten chicken"],
    [/^cat sterilized and light(?: chicken)?$/u, "sterilized light chicken"],
    [/^sterili[sz]ed light(?: chicken)?$/u, "sterilized light chicken"],
  ];

  for (const [pattern, replacement] of aliases) {
    if (pattern.test(text)) return replacement;
  }

  return text;
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalKey(row) {
  return [
    slugify(row.brand),
    slugify(applySchesirAlias(row.formula_name || row.display_name)),
    slugify(row.species),
    slugify(row.format),
  ]
    .filter(Boolean)
    .join("|");
}

function sourceScore(row) {
  if (row.source_priority === "official") return 30;
  if (row.source_priority === "retailer") return 20;
  if (row.source_priority === "manual_photo") return 15;
  return 0;
}

function titleScore(row) {
  const title = `${row.display_name ?? ""} ${row.formula_name ?? ""}`.toLowerCase();
  let score = 0;
  if (!title.includes("dry medium maintenance")) score += 8;
  if (!title.includes("dry small maintenance")) score += 8;
  if (!title.includes("cat sterilized")) score += 4;
  if (!title.includes("dry kitten")) score += 4;
  if (title.includes("adult medium chicken")) score += 8;
  if (title.includes("adult small chicken")) score += 8;
  if (title.includes("sterilized light chicken")) score += 6;
  if (title.includes("kitten chicken")) score += 6;
  return score;
}

function rowScore(row) {
  return sourceScore(row) + titleScore(row) + (row.data_quality_status === "verified" ? 10 : 0);
}

function renderReport(groups, rows) {
  const duplicateGroups = groups.filter((group) => group.rows.length > 1);
  return `# Schesir Food V2 DB Cleanup Audit

Generated: ${new Date().toISOString()}

## Summary

- Schesir Food V2 rows reviewed: ${rows.length}
- Duplicate canonical groups: ${duplicateGroups.length}
- Cleanup CSV: ${paths.csv}

## Recommended Handling

This is a read-only audit. Do not delete rows blindly. For each duplicate canonical group, keep the recommended formula key, compare nutrients/sources in admin, then merge or remove the older duplicate only after review.

## Duplicate Groups

${duplicateGroups
  .map(
    (group) =>
      `- ${group.key}: ${group.rows.length} rows, keep=${group.keep.formula_key}`
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

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("food_products_v2")
    .select(
      "brand, display_name, formula_name, species, format, formula_key, data_quality_status, source_priority, updated_at"
    )
    .ilike("brand", "Schesir")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const groupsByKey = new Map();

  for (const row of rows) {
    const key = canonicalKey(row);
    const group = groupsByKey.get(key) ?? [];
    group.push(row);
    groupsByKey.set(key, group);
  }

  const groups = [...groupsByKey.entries()].map(([key, groupRows]) => {
    const sorted = [...groupRows].sort(
      (a, b) =>
        rowScore(b) - rowScore(a) ||
        String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""))
    );
    return { key, rows: sorted, keep: sorted[0] };
  });

  const outputRows = groups
    .filter((group) => group.rows.length > 1)
    .flatMap((group) =>
      group.rows.map((row) => ({
        canonical_key: group.key,
        row_count: group.rows.length,
        recommended_action:
          row.formula_key === group.keep.formula_key
            ? "keep_canonical_row"
            : "review_as_duplicate_before_merge_or_delete",
        keep_formula_key: group.keep.formula_key,
        formula_key: row.formula_key,
        display_name: row.display_name,
        formula_name: row.formula_name,
        species: row.species,
        format: row.format,
        source_priority: row.source_priority,
        data_quality_status: row.data_quality_status,
        updated_at: row.updated_at,
      }))
    );

  await mkdir(path.dirname(paths.csv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csv, writeCsv(outputRows), "utf8");
  await writeFile(paths.report, renderReport(groups, rows), "utf8");

  console.log(`Schesir Food V2 rows reviewed: ${rows.length}`);
  console.log(`Duplicate canonical groups: ${groups.filter((group) => group.rows.length > 1).length}`);
  console.log(`Wrote ${paths.csv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
