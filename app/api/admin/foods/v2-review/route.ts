import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const PRODUCT_LIMIT = 100;
const AUDIT_LIMIT = 50;
const QUEUE_LIMIT = 2600;
const SUPPLEMENTAL_REVIEW_FILES = [
  {
    reviewFile: "data/review/gatoskilo_local_html_batch_review.csv",
    datasetFile: "data/imports/gatoskilo_local_html_batch_v2.csv",
    sourceLabel: "gatoskilo_local_html_batch",
  },
] as const;
const FOOD_V2_PREVIEW_HEADERS = [
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "life_stage",
  "dog_size",
  "data_quality_status",
  "data_source_url",
  "source_priority",
  "source_notes",
  "formula_key",
] as const;

type QueueCsvRow = {
  decision?: string;
  dataset_file?: string;
  formula_key?: string;
  brand?: string;
  formula_name?: string;
  species?: string;
  quality_status?: string;
  source_priority?: string;
  missing_blockers?: string;
  next_action?: string;
};

type SupplementalReviewRow = {
  formula_key?: string;
  brand?: string;
  formula_name?: string;
  species?: string;
  format?: string;
  status?: string;
  missing_fields?: string;
  notes?: string;
};

type ParsedCsv = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

type DatasetIndex = {
  headers: string[];
  rowsByFormulaKey: Map<string, Record<string, string>>;
};

type EnrichedQueueRow = QueueCsvRow & {
  display_brand: string;
  display_formula_name: string;
  text_issues: string;
  review_bucket: string;
  preview_row: Record<string, string>;
};

function normalizeCsvFileName(filePath: string) {
  const fileName = path.basename(String(filePath ?? ""));
  if (!fileName.endsWith(".csv")) {
    throw new Error(`Unsupported review file: ${filePath}`);
  }

  return fileName;
}

function reviewCsvPath(filePath: string) {
  return path.join(process.cwd(), "data", "review", normalizeCsvFileName(filePath));
}

function importCsvPath(filePath: string) {
  return path.join(process.cwd(), "data", "imports", normalizeCsvFileName(filePath));
}

let iso88597ByteMap: Map<string, number> | null = null;

function getIso88597ByteMap() {
  if (iso88597ByteMap) return iso88597ByteMap;

  const decoder = new TextDecoder("iso-8859-7");
  iso88597ByteMap = new Map();
  for (let byte = 0; byte <= 255; byte += 1) {
    iso88597ByteMap.set(decoder.decode(new Uint8Array([byte])), byte);
  }

  return iso88597ByteMap;
}

function countGreekLetters(value: string) {
  return (value.match(/[\u0370-\u03ff]/g) ?? []).length;
}

function countMojibakeMarkers(value: string) {
  return (value.match(/[ΞΟ][\u0380-\u03ffA-Za-zΆΈΉΊΌΎΏάέήίόύώ΅µ]/g) ?? [])
    .length;
}

function repairGreekMojibake(value: string) {
  const text = String(value ?? "");
  if (!text || !/[ΞΟ][\u0380-\u03ffA-Za-zΆΈΉΊΌΎΏάέήίόύώ΅µ]/.test(text)) {
    return { value: text, repaired: false };
  }

  const byteMap = getIso88597ByteMap();
  const bytes: number[] = [];

  for (const char of text) {
    const byte = byteMap.get(char);
    if (byte === undefined) {
      return { value: text, repaired: false };
    }
    bytes.push(byte);
  }

  const repaired = new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(bytes)
  );
  const originalMarkerCount = countMojibakeMarkers(text);
  const repairedMarkerCount = countMojibakeMarkers(repaired);
  const isBetter =
    repaired &&
    !repaired.includes("\uFFFD") &&
    repairedMarkerCount < originalMarkerCount &&
    countGreekLetters(repaired) >= countGreekLetters(text) / 2;

  return { value: isBetter ? repaired : text, repaired: isBetter };
}

function inferFormat(row: QueueCsvRow) {
  const source = `${row.formula_key ?? ""} ${row.formula_name ?? ""}`.toLowerCase();
  if (source.includes("-wet-") || source.includes(" wet ")) return "wet";
  if (source.includes("-treat-") || source.includes(" treat ")) return "treat";
  if (source.includes("-supplement-") || source.includes(" supplement ")) {
    return "supplement";
  }
  return "dry";
}

function classifyReviewBucket(row: QueueCsvRow, textIssue: boolean) {
  const blockers = String(row.missing_blockers ?? "");
  const decision = String(row.decision ?? "");

  if (decision === "reject") return "rejected";
  if (textIssue) return "fix_text_encoding";
  if (decision === "candidate") return "ready_for_preview";
  if (blockers.includes("data_source_url_or_manual_photo")) {
    return "needs_source_or_photo";
  }
  if (blockers.includes("kcal_per_100g_or_kcal_per_kg")) return "needs_energy";
  if (blockers) return "needs_missing_fields";
  return "needs_manual_review";
}

function buildSourceNotes(row: QueueCsvRow, fullRow?: Record<string, string>) {
  const existingNotes = String(fullRow?.source_notes ?? "").trim();
  const queueNotes = [
    `source_file=${row.dataset_file ?? ""}`,
    `queue_decision=${row.decision ?? ""}`,
    `missing_blockers=${row.missing_blockers ?? "none"}`,
    `next_action=${row.next_action ?? ""}`,
  ]
    .filter(Boolean)
    .join("; ");

  return [existingNotes, queueNotes].filter(Boolean).join("; ");
}

function buildPreviewRow(
  row: QueueCsvRow,
  displayBrand: string,
  displayFormulaName: string,
  fullRow?: Record<string, string>
) {
  const sourceNotes = buildSourceNotes(row, fullRow);

  if (fullRow) {
    const brand = displayBrand || fullRow.brand || row.brand || "";
    const formulaName =
      displayFormulaName || fullRow.formula_name || row.formula_name || "";

    return {
      ...fullRow,
      brand,
      formula_name: formulaName,
      display_name: fullRow.display_name || `${brand} ${formulaName}`.trim(),
      species: fullRow.species || row.species || "dog",
      format: fullRow.format || inferFormat(row),
      data_quality_status:
        fullRow.data_quality_status || row.quality_status || "needs_review",
      source_priority: fullRow.source_priority || row.source_priority || "unknown",
      source_notes: sourceNotes,
      formula_key: fullRow.formula_key || row.formula_key || "",
    };
  }

  const format = inferFormat(row);

  return Object.fromEntries(
    FOOD_V2_PREVIEW_HEADERS.map((header) => {
      const values: Record<(typeof FOOD_V2_PREVIEW_HEADERS)[number], string> = {
        brand: displayBrand || row.brand || "",
        formula_name: displayFormulaName,
        display_name: `${displayBrand || row.brand || ""} ${displayFormulaName}`.trim(),
        species: row.species || "dog",
        format,
        life_stage: "unknown",
        dog_size: "unknown",
        data_quality_status: row.quality_status || "needs_review",
        data_source_url: "",
        source_priority: row.source_priority || "unknown",
        source_notes: sourceNotes,
        formula_key: row.formula_key ?? "",
      };

      return [header, values[header]];
    })
  );
}

function parseCsvWithHeaders(text: string): ParsedCsv {
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
    header.replace(/^\uFEFF/, "").trim()
  );

  return {
    headers,
    rows: rows.slice(1).map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""])
      ) as Record<string, string>
    ),
  };
}

function parseCsv(text: string): Array<Record<string, string>> {
  return parseCsvWithHeaders(text).rows;
}

async function readSupplementalReviewQueueRows() {
  const rows: QueueCsvRow[] = [];

  for (const source of SUPPLEMENTAL_REVIEW_FILES) {
    try {
      const parsed = parseCsv(
        await readFile(reviewCsvPath(source.reviewFile), "utf8")
      ) as SupplementalReviewRow[];

      for (const row of parsed) {
        if (!row.formula_key) continue;

        const isCandidate = row.status === "importable_after_qa";
        rows.push({
          decision: isCandidate ? "candidate" : "hold",
          dataset_file: source.datasetFile,
          formula_key: row.formula_key,
          brand: row.brand ?? "",
          formula_name: row.formula_name ?? "",
          species: row.species ?? "",
          quality_status: "needs_review",
          source_priority: "retailer",
          missing_blockers: row.missing_fields ?? "",
          next_action: isCandidate
            ? "Preview in admin and commit only after human QA."
            : "Backfill missing fields before Food V2 commit.",
        });
      }
    } catch {
      // Supplemental review files are generated artifacts. If one is missing,
      // keep the main queue available and let the report reveal the gap.
    }
  }

  return rows;
}

function appendUniqueHeaders(target: string[], headers: string[]) {
  headers.forEach((header) => {
    if (header && !target.includes(header)) target.push(header);
  });
}

async function readDatasetIndexes(datasetFiles: string[]) {
  const indexes = new Map<string, DatasetIndex>();
  const previewHeaders: string[] = [];

  for (const datasetFile of datasetFiles) {
    try {
      const parsed = parseCsvWithHeaders(
        await readFile(importCsvPath(datasetFile), "utf8")
      );
      indexes.set(datasetFile, {
        headers: parsed.headers,
        rowsByFormulaKey: new Map(
          parsed.rows
            .filter((row) => row.formula_key)
            .map((row) => [row.formula_key, row])
        ),
      });
      appendUniqueHeaders(previewHeaders, parsed.headers);
    } catch {
      // Missing source files should not hide the queue; those rows fall back to
      // the minimal preview shape and stay blocked until the source is restored.
    }
  }

  if (previewHeaders.length === 0) {
    appendUniqueHeaders(previewHeaders, [...FOOD_V2_PREVIEW_HEADERS]);
  }

  return { indexes, previewHeaders };
}

async function readImportQueue() {
  try {
    const csv = await readFile(
      reviewCsvPath("food_v2_import_candidate_queue.csv"),
      "utf8"
    );
    const rows = [
      ...(parseCsv(csv) as QueueCsvRow[]),
      ...(await readSupplementalReviewQueueRows()),
    ];
    const datasetFiles = Array.from(
      new Set(rows.map((row) => row.dataset_file).filter(Boolean))
    ) as string[];
    const { indexes, previewHeaders } = await readDatasetIndexes(datasetFiles);

    const enrichedRows: EnrichedQueueRow[] = rows.map((row) => {
      const formulaRepair = repairGreekMojibake(String(row.formula_name ?? ""));
      const brandRepair = repairGreekMojibake(String(row.brand ?? ""));
      const textIssues = [
        formulaRepair.repaired ? "formula_name_encoding_repaired" : "",
        brandRepair.repaired ? "brand_encoding_repaired" : "",
      ].filter(Boolean);
      const reviewBucket = classifyReviewBucket(row, textIssues.length > 0);
      const fullRow =
        row.dataset_file && row.formula_key
          ? indexes.get(row.dataset_file)?.rowsByFormulaKey.get(row.formula_key)
          : undefined;

      return {
        ...row,
        display_brand: brandRepair.value,
        display_formula_name: formulaRepair.value,
        text_issues: textIssues.join("|"),
        review_bucket: reviewBucket,
        preview_row: buildPreviewRow(
          row,
          brandRepair.value,
          formulaRepair.value,
          fullRow
        ),
      };
    });

    const decisionCounts = enrichedRows.reduce<Record<string, number>>((acc, row) => {
      const decision = row.decision || "unknown";
      acc[decision] = (acc[decision] ?? 0) + 1;
      return acc;
    }, {});

    const brandCounts = enrichedRows.reduce<Record<string, number>>((acc, row) => {
      const brand = row.display_brand || row.brand || "Unknown";
      acc[brand] = (acc[brand] ?? 0) + 1;
      return acc;
    }, {});

    const missingFieldCounts = enrichedRows.reduce<Record<string, number>>(
      (acc, row) => {
        String(row.missing_blockers ?? "")
          .split("|")
          .map((field) => field.trim())
          .filter(Boolean)
          .forEach((field) => {
            acc[field] = (acc[field] ?? 0) + 1;
          });
        return acc;
      },
      {}
    );

    const datasetCounts = enrichedRows.reduce<Record<string, number>>((acc, row) => {
      const dataset = row.dataset_file || "Unknown";
      acc[dataset] = (acc[dataset] ?? 0) + 1;
      return acc;
    }, {});

    const speciesCounts = enrichedRows.reduce<Record<string, number>>((acc, row) => {
      const species = row.species || "unknown";
      acc[species] = (acc[species] ?? 0) + 1;
      return acc;
    }, {});

    const qualityStatusCounts = enrichedRows.reduce<Record<string, number>>(
      (acc, row) => {
        const status = row.quality_status || "unknown";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const reviewBucketCounts = enrichedRows.reduce<Record<string, number>>(
      (acc, row) => {
        const bucket = row.review_bucket || "needs_manual_review";
        acc[bucket] = (acc[bucket] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const textIssueCounts = enrichedRows.reduce<Record<string, number>>(
      (acc, row) => {
        String(row.text_issues ?? "")
          .split("|")
          .map((issue) => issue.trim())
          .filter(Boolean)
          .forEach((issue) => {
            acc[issue] = (acc[issue] ?? 0) + 1;
          });
        return acc;
      },
      {}
    );

    return {
      summary: {
        totalRows: enrichedRows.length,
        decisionCounts,
        brandCounts,
        missingFieldCounts,
        datasetCounts,
        speciesCounts,
        qualityStatusCounts,
        reviewBucketCounts,
        textIssueCounts,
        previewHeaders,
      },
      rows: enrichedRows.slice(0, QUEUE_LIMIT),
    };
  } catch {
    return {
      summary: {
        totalRows: 0,
        decisionCounts: {},
        brandCounts: {},
        missingFieldCounts: {},
        datasetCounts: {},
        speciesCounts: {},
        qualityStatusCounts: {},
        reviewBucketCounts: {},
        textIssueCounts: {},
        previewHeaders: [...FOOD_V2_PREVIEW_HEADERS],
      },
      rows: [],
    };
  }
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [
      totalProductsResult,
      verifiedProductsResult,
      needsReviewProductsResult,
      unknownProductsResult,
      totalAuditRowsResult,
      blockedAuditRowsResult,
      { data: products, error: productsError },
      { data: auditRows, error: auditError },
      importQueue,
    ] = await Promise.all([
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "verified"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "needs_review"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "unknown"),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true })
        .eq("importable", false),
      supabaseAdmin
        .from("food_products_v2")
        .select(
          "id, brand, display_name, species, format, life_stage, dog_size, data_quality_status, source_priority, formula_key, kcal_per_100g, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(PRODUCT_LIMIT),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select(
          "id, formula_key, importable, completeness_score, missing_fields, warnings, impossible_values, conflicts, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(AUDIT_LIMIT),
      readImportQueue(),
    ]);

    if (totalProductsResult.error) throw totalProductsResult.error;
    if (verifiedProductsResult.error) throw verifiedProductsResult.error;
    if (needsReviewProductsResult.error) throw needsReviewProductsResult.error;
    if (unknownProductsResult.error) throw unknownProductsResult.error;
    if (totalAuditRowsResult.error) throw totalAuditRowsResult.error;
    if (blockedAuditRowsResult.error) throw blockedAuditRowsResult.error;
    if (productsError) throw productsError;
    if (auditError) throw auditError;

    return NextResponse.json({
      summary: {
        totalProducts: totalProductsResult.count ?? 0,
        verifiedProducts: verifiedProductsResult.count ?? 0,
        needsReviewProducts: needsReviewProductsResult.count ?? 0,
        unknownProducts: unknownProductsResult.count ?? 0,
        totalAuditRows: totalAuditRowsResult.count ?? 0,
        blockedAuditRows: blockedAuditRowsResult.count ?? 0,
      },
      products: products ?? [],
      auditRows: auditRows ?? [],
      importQueue,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Food V2 review data.",
      },
      { status: 500 }
    );
  }
}
