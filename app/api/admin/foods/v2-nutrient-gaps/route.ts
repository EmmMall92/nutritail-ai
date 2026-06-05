import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type NutrientGapRow = {
  priority: string;
  gap_score: number;
  brand: string;
  display_name: string;
  species: string;
  format: string;
  life_stage: string;
  data_quality_status: string;
  source_priority: string;
  formula_key: string;
  missing_blockers: string[];
  estimated_fields_to_replace: string[];
  missing_helpful_fields: string[];
  health_context: string[];
  recommended_evidence: string;
  next_action: string;
  data_source_url: string;
};

const csvPath = path.join(
  process.cwd(),
  "data",
  "review",
  "food_v2_nutrient_gap_priorities.csv"
);

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
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

function splitList(value: unknown) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRow(row: Record<string, unknown>): NutrientGapRow {
  return {
    priority: String(row.priority ?? "low"),
    gap_score: Number(row.gap_score ?? 0),
    brand: String(row.brand ?? ""),
    display_name: String(row.display_name ?? ""),
    species: String(row.species ?? ""),
    format: String(row.format ?? ""),
    life_stage: String(row.life_stage ?? ""),
    data_quality_status: String(row.data_quality_status ?? ""),
    source_priority: String(row.source_priority ?? ""),
    formula_key: String(row.formula_key ?? ""),
    missing_blockers: splitList(row.missing_blockers),
    estimated_fields_to_replace: splitList(row.estimated_fields_to_replace),
    missing_helpful_fields: splitList(row.missing_helpful_fields),
    health_context: splitList(row.health_context),
    recommended_evidence: String(row.recommended_evidence ?? ""),
    next_action: String(row.next_action ?? ""),
    data_source_url: String(row.data_source_url ?? ""),
  };
}

function countBy<T extends string>(rows: NutrientGapRow[], getKey: (row: NutrientGapRow) => T) {
  return rows.reduce<Record<T, number>>((acc, row) => {
    const key = getKey(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function countListValues(rows: NutrientGapRow[], getValues: (row: NutrientGapRow) => string[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const values = getValues(row);
    if (values.length === 0) {
      acc.none = (acc.none ?? 0) + 1;
      return acc;
    }

    for (const value of values) {
      acc[value] = (acc[value] ?? 0) + 1;
    }
    return acc;
  }, {});
}

function topCounts(counts: Record<string, number>, limit = 12) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const raw = await readFile(csvPath, "utf8");
    const rows = parseCsv(raw).map(mapRow);

    return NextResponse.json({
      generated_from: "data/review/food_v2_nutrient_gap_priorities.csv",
      total_rows: rows.length,
      summary: {
        by_priority: countBy(rows, (row) => row.priority),
        by_species: countBy(rows, (row) => row.species || "unknown"),
        top_brands: topCounts(countBy(rows, (row) => row.brand || "Unknown"), 20),
        top_blockers: topCounts(
          countListValues(rows, (row) => row.missing_blockers)
        ),
        top_estimated_fields: topCounts(
          countListValues(rows, (row) => row.estimated_fields_to_replace)
        ),
        top_health_context: topCounts(
          countListValues(rows, (row) => row.health_context)
        ),
      },
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Food V2 nutrient gaps.",
      },
      { status: 500 }
    );
  }
}
