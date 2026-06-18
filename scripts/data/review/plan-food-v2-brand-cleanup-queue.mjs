import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  brandReadiness: "data/review/food_v2_brand_readiness_audit.csv",
  titleQuality: "data/review/food_v2_title_quality_audit.csv",
  duplicateRisks: "data/review/food_v2_duplicate_merge_risk_audit.csv",
  output: "data/review/food_v2_brand_cleanup_queue.csv",
  report: "reports/food_v2_brand_cleanup_queue.md",
};

const headers = [
  "priority_rank",
  "brand",
  "priority_score",
  "recommended_phase",
  "total_rows",
  "readiness_status",
  "title_issue_rows",
  "duplicate_risk_groups",
  "missing_calcium_phosphorus_rows",
  "missing_ash_rows",
  "estimated_kcal_rows",
  "official_rows",
  "retailer_rows",
  "recommended_action",
];

const strategicBrandWeights = new Map([
  ["Royal Canin", 35],
  ["Royal Canin Veterinary Diet", 32],
  ["Schesir", 30],
  ["Ambrosia", 28],
  ["Josera", 28],
  ["N&D", 27],
  ["Farmina", 27],
  ["Acana", 25],
  ["ACANA", 25],
  ["Orijen", 25],
  ["Purina Pro Plan", 25],
  ["Brit", 24],
  ["Happy Dog", 24],
  ["Monge", 24],
  ["Hill's Prescription Diet", 20],
  ["Hills", 20],
  ["Belcando", 18],
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

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function addCount(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function inferBrandFromDuplicate(row) {
  const key = String(row.canonical_identity_key ?? "");
  const firstKeyPart = key.split("|")[0]?.trim();
  if (firstKeyPart) {
    const known = [...strategicBrandWeights.keys()].find(
      (brand) => brand.toLowerCase() === firstKeyPart
    );
    if (known) return known;
    return firstKeyPart
      .split(/\s+/u)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const displayName = String(row.best_display_name ?? "");
  return [...strategicBrandWeights.keys()].find((brand) =>
    displayName.toLowerCase().startsWith(brand.toLowerCase())
  );
}

function phaseFor(row) {
  const duplicateRiskGroups = toNumber(row.duplicate_risk_groups);
  const titleIssueRows = toNumber(row.title_issue_rows);
  const missingCaP = toNumber(row.missing_calcium_phosphorus_rows);
  const estimatedKcal = toNumber(row.estimated_kcal_rows);

  if (duplicateRiskGroups > 0) return "dedupe_before_import";
  if (titleIssueRows > 0) return "title_cleanup";
  if (missingCaP > 0 || estimatedKcal > 0) return "nutrient_backfill";
  if (row.readiness_status === "ready_for_controlled_import") {
    return "controlled_import_ready";
  }
  return "small_batch_review";
}

function actionFor(row) {
  const phase = row.recommended_phase;
  if (phase === "dedupe_before_import") {
    return "Review duplicate groups first, pick one canonical survivor per formula, then import.";
  }
  if (phase === "title_cleanup") {
    return "Clean customer-facing formula names before wider chatbot exposure.";
  }
  if (phase === "nutrient_backfill") {
    return "Backfill calcium/phosphorus, ash or estimated kcal where possible before confident recommendations.";
  }
  if (phase === "controlled_import_ready") {
    return "Use admin preview, Check Existing, then import selected rows.";
  }
  return "Run a small admin preview batch and manually inspect titles, source and duplicates.";
}

function priorityScore(row) {
  const strategic = strategicBrandWeights.get(row.brand) ?? 0;
  const totalRows = Math.min(toNumber(row.total_rows), 120) * 0.25;
  const title = Math.min(toNumber(row.title_issue_rows), 80) * 1.4;
  const duplicate = Math.min(toNumber(row.duplicate_risk_groups), 40) * 3;
  const mineral = Math.min(toNumber(row.missing_calcium_phosphorus_rows), 120) * 0.35;
  const estimated = Math.min(toNumber(row.estimated_kcal_rows), 80) * 0.2;
  const readiness =
    row.readiness_status === "ready_for_controlled_import"
      ? 6
      : row.readiness_status === "review_before_import"
        ? 10
        : row.readiness_status === "needs_cleanup_or_source_backfill"
          ? 14
          : 4;

  return Math.round(strategic + totalRows + title + duplicate + mineral + estimated + readiness);
}

function renderReport(rows) {
  const topRows = rows.slice(0, 30);
  const byPhase = rows.reduce((counts, row) => {
    counts.set(row.recommended_phase, (counts.get(row.recommended_phase) ?? 0) + 1);
    return counts;
  }, new Map());

  return [
    "# Food V2 Brand Cleanup Queue",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Brands queued: ${rows.length}`,
    `- Top priority brand: ${rows[0]?.brand ?? "none"}`,
    `- Output CSV: ${paths.output}`,
    "",
    "## Queue By Phase",
    "",
    ...[...byPhase.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([phase, count]) => `- ${phase}: ${count}`),
    "",
    "## Top Cleanup Priorities",
    "",
    ...topRows.map(
      (row) =>
        `- ${row.priority_rank}. ${row.brand}: score ${row.priority_score}; ${row.recommended_phase}; rows=${row.total_rows}; titles=${row.title_issue_rows}; duplicates=${row.duplicate_risk_groups}; Ca/P gaps=${row.missing_calcium_phosphorus_rows}`
    ),
    "",
    "## Operating Rule",
    "",
    "Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.",
  ].join("\n");
}

async function main() {
  const [brandRows, titleRows, duplicateRows] = await Promise.all([
    readFile(paths.brandReadiness, "utf8").then(parseCsv),
    readFile(paths.titleQuality, "utf8").then(parseCsv),
    readFile(paths.duplicateRisks, "utf8").then(parseCsv),
  ]);

  const titleIssuesByBrand = new Map();
  const duplicateGroupsByBrand = new Map();

  for (const row of titleRows) addCount(titleIssuesByBrand, row.brand);
  for (const row of duplicateRows) {
    if (row.risk_level === "hold") continue;
    addCount(duplicateGroupsByBrand, inferBrandFromDuplicate(row));
  }

  const queue = brandRows
    .map((row) => {
      const titleIssueRows = titleIssuesByBrand.get(row.brand) ?? 0;
      const duplicateRiskGroups = duplicateGroupsByBrand.get(row.brand) ?? 0;
      const enriched = {
        brand: row.brand,
        total_rows: toNumber(row.total_rows),
        readiness_status: row.readiness_status,
        title_issue_rows: titleIssueRows,
        duplicate_risk_groups: duplicateRiskGroups,
        missing_calcium_phosphorus_rows: toNumber(row.missing_core_mineral_rows),
        missing_ash_rows: toNumber(row.missing_ash_rows),
        estimated_kcal_rows: toNumber(row.estimated_kcal_rows),
        official_rows: toNumber(row.official_rows),
        retailer_rows: toNumber(row.retailer_rows),
      };
      const recommended_phase = phaseFor(enriched);
      const fullRow = {
        ...enriched,
        recommended_phase,
      };
      return {
        ...fullRow,
        priority_score: priorityScore(fullRow),
        recommended_action: actionFor(fullRow),
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score || b.total_rows - a.total_rows)
    .map((row, index) => ({ priority_rank: index + 1, ...row }));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(
    paths.output,
    [headers.join(","), ...queue.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n"),
    "utf8"
  );
  await writeFile(paths.report, renderReport(queue), "utf8");

  console.log(
    JSON.stringify(
      {
        brands: queue.length,
        topBrand: queue[0]?.brand ?? null,
        output: paths.output,
        report: paths.report,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
