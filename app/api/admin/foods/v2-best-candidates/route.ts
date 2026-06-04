import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function GET() {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const csvPath = path.join(
    process.cwd(),
    "data",
    "imports",
    "food_v2_best_candidate_preview.csv"
  );
  const csv = await readFile(csvPath, "utf8");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="nutritail-food-v2-best-candidate-preview.csv"',
    },
  });
}
