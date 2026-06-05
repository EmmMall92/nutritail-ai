import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  dedupeRows: "data/review/food_v2_source_dedupe_rows.csv",
  bestCandidates: "data/imports/food_v2_best_candidate_preview.csv",
  output: "data/review/food_v2_duplicate_merge_risk_audit.csv",
  report: "reports/food_v2_duplicate_merge_risk_audit.md",
};

const headers = [
  "canonical_identity_key",
  "row_count",
  "candidate_count",
  "hold_count",
  "risk_level",
  "risk_reason",
  "recommended_action",
  "best_formula_key",
  "best_display_name",
  "source_priorities",
  "kcal_range",
  "protein_range",
  "fat_range",
  "fiber_range",
  "ash_range",
  "formula_keys",
];

const nutrientFields = [
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "ash_percent",
];

const materialDeltaThresholds = {
  kcal_per_100g: 20,
  protein_percent: 2,
  fat_percent: 2,
  fiber_percent: 2,
  ash_percent: 2,
};

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

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
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

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.toLowerCase() !== "null";
}

function numberValue(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function numericRange(rows, field) {
  const values = rows
    .map((row) => numberValue(row[field]))
    .filter((value) => value !== null);
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? String(min) : `${min}-${max}`;
}

function numericDelta(rows, field) {
  const values = rows
    .map((row) => numberValue(row[field]))
    .filter((value) => value !== null);
  if (values.length < 2) return 0;
  return Math.max(...values) - Math.min(...values);
}

function sourceRank(value) {
  if (value === "official") return 4;
  if (value === "manual_photo") return 3;
  if (value === "retailer") return 2;
  return 1;
}

function compactList(values) {
  return [...new Set(values.filter(Boolean))].join("|");
}

function materialDeltaReasons(rows) {
  return nutrientFields
    .map((field) => ({
      field,
      delta: numericDelta(rows, field),
      threshold: materialDeltaThresholds[field],
    }))
    .filter((item) => item.delta > item.threshold)
    .map((item) => `${item.field}_delta=${item.delta.toFixed(2)}`);
}

function classifyGroup(rows) {
  const candidateRows = rows.filter((row) => row.decision === "candidate");
  const priorities = [...new Set(rows.map((row) => row.source_priority).filter(Boolean))];
  const materialReasons = materialDeltaReasons(rows);
  const sourceRanks = rows.map((row) => sourceRank(row.source_priority));
  const mixedSourceRank = Math.max(...sourceRanks) !== Math.min(...sourceRanks);
  const duplicateCandidates = candidateRows.length > 1;
  const allHold = candidateRows.length === 0;

  if (allHold) {
    return {
      risk_level: "hold",
      risk_reason: "no_importable_candidate",
      recommended_action: "Do not merge or import until blockers are resolved.",
    };
  }

  if (materialReasons.length > 0) {
    return {
      risk_level: "high",
      risk_reason: materialReasons.join("; "),
      recommended_action:
        "Manual review required. Do not auto-merge; verify label/PDF/source before choosing survivor.",
    };
  }

  if (duplicateCandidates) {
    return {
      risk_level: "medium",
      risk_reason: "multiple_importable_candidates",
      recommended_action:
        "Use conflict check before commit. Import only one survivor for this canonical identity.",
    };
  }

  if (mixedSourceRank && priorities.includes("official")) {
    return {
      risk_level: "medium",
      risk_reason: "official_and_lower_priority_sources_overlap",
      recommended_action:
        "Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.",
    };
  }

  if (rows.length > 1) {
    return {
      risk_level: "low",
      risk_reason: "same_formula_evidence_or_pack_variant",
      recommended_action:
        "Safe to use best row as survivor if title and pack-size differences look expected.",
    };
  }

  return {
    risk_level: "none",
    risk_reason: "single_row",
    recommended_action: "No duplicate action needed.",
  };
}

function renderReport(rows) {
  const counts = rows.reduce((acc, row) => {
    acc[row.risk_level] = (acc[row.risk_level] ?? 0) + 1;
    return acc;
  }, {});
  const highRows = rows.filter((row) => row.risk_level === "high").slice(0, 20);
  const mediumRows = rows.filter((row) => row.risk_level === "medium").slice(0, 20);

  const renderRows = (items) =>
    items
      .map(
        (row) =>
          `- ${row.best_display_name}: ${row.risk_reason}; action=${row.recommended_action}`
      )
      .join("\n") || "- none";

  return `# Food V2 Duplicate Merge Risk Audit

Generated: ${new Date().toISOString()}

## Summary

- Groups analyzed: ${rows.length}
- High risk groups: ${counts.high ?? 0}
- Medium risk groups: ${counts.medium ?? 0}
- Low risk groups: ${counts.low ?? 0}
- Hold groups: ${counts.hold ?? 0}
- Output CSV: ${paths.output}

## High Risk Groups

${renderRows(highRows)}

## Medium Risk Groups

${renderRows(mediumRows)}

## Operating Rule

High-risk groups should never be auto-merged. Medium-risk groups should run through the admin conflict check and keep only one survivor per canonical identity. Low-risk groups are likely source/pack-size evidence duplicates, but still need a quick title/source spot-check.
`;
}

async function main() {
  const dedupeRows = parseCsv(await readFile(paths.dedupeRows, "utf8"));
  const previewRows = parseCsv(await readFile(paths.bestCandidates, "utf8"));
  const previewByFormulaKey = new Map(
    previewRows.map((row) => [row.formula_key, row])
  );
  const byCanonical = new Map();

  for (const row of dedupeRows) {
    const enriched = {
      ...previewByFormulaKey.get(row.formula_key),
      ...row,
    };
    const group = byCanonical.get(row.canonical_identity_key) ?? [];
    group.push(enriched);
    byCanonical.set(row.canonical_identity_key, group);
  }

  const auditRows = [...byCanonical.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([canonicalKey, rows]) => {
      const sortedRows = [...rows].sort(
        (a, b) => Number(a.rank || 999) - Number(b.rank || 999)
      );
      const best = sortedRows[0];
      const classification = classifyGroup(sortedRows);

      return {
        canonical_identity_key: canonicalKey,
        row_count: sortedRows.length,
        candidate_count: sortedRows.filter((row) => row.decision === "candidate").length,
        hold_count: sortedRows.filter((row) => row.decision === "hold").length,
        ...classification,
        best_formula_key: best.formula_key,
        best_display_name: best.display_name,
        source_priorities: compactList(sortedRows.map((row) => row.source_priority)),
        kcal_range: numericRange(sortedRows, "kcal_per_100g"),
        protein_range: numericRange(sortedRows, "protein_percent"),
        fat_range: numericRange(sortedRows, "fat_percent"),
        fiber_range: numericRange(sortedRows, "fiber_percent"),
        ash_range: numericRange(sortedRows, "ash_percent"),
        formula_keys: compactList(sortedRows.map((row) => row.formula_key)),
      };
    })
    .sort((a, b) => {
      const riskOrder = { high: 1, medium: 2, low: 3, hold: 4, none: 5 };
      return (
        (riskOrder[a.risk_level] ?? 99) - (riskOrder[b.risk_level] ?? 99) ||
        Number(b.row_count) - Number(a.row_count) ||
        a.best_display_name.localeCompare(b.best_display_name)
      );
    });

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(auditRows), "utf8");
  await writeFile(paths.report, renderReport(auditRows), "utf8");

  console.log(`Food V2 duplicate merge risk groups: ${auditRows.length}`);
  console.log(`High risk groups: ${auditRows.filter((row) => row.risk_level === "high").length}`);
  console.log(`Medium risk groups: ${auditRows.filter((row) => row.risk_level === "medium").length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
