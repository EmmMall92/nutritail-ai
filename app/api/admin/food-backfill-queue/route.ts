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

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const raw = await readFile(queuePath, "utf8");
    const queue = JSON.parse(raw);

    return NextResponse.json({
      queue: Array.isArray(queue) ? queue : [],
      generatedFrom: "data/review/food_backfill_priority_queue.json",
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
