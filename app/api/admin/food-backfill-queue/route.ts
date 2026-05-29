import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const queuePath = path.join(
  process.cwd(),
  "data",
  "review",
  "food_backfill_priority_queue.json"
);
const batchesPath = path.join(
  process.cwd(),
  "data",
  "review",
  "food_evidence_collection_batches.json"
);

async function readJsonArray(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  const data = JSON.parse(raw);

  return Array.isArray(data) ? data : [];
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [queue, evidenceBatches] = await Promise.all([
      readJsonArray(queuePath),
      readJsonArray(batchesPath),
    ]);

    return NextResponse.json({
      queue,
      evidenceBatches,
      generatedFrom: "data/review/food_backfill_priority_queue.json",
      evidenceBatchesGeneratedFrom:
        "data/review/food_evidence_collection_batches.json",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load food backfill queue.",
      },
      { status: 500 }
    );
  }
}
