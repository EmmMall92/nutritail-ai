import { NextResponse } from "next/server";
import { adminDuplicateReviewService } from "@/services/adminDuplicateReviewService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const ALLOWED_DUPLICATE_TYPES = new Set(["food", "pet"]);
const ALLOWED_REVIEW_STATUSES = new Set([
  "open",
  "reviewed",
  "false-positive",
  "merge-later",
  "merged",
]);

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const duplicateKey = String(body.duplicateKey ?? "").trim();
    const duplicateType = String(body.duplicateType ?? "")
      .trim()
      .toLowerCase();
    const status = String(body.status ?? "open").trim().toLowerCase();
    const notes = String(body.notes ?? "").trim();
    const chosenRecordId = String(body.chosenRecordId ?? "").trim();

    if (!duplicateKey) {
      return NextResponse.json(
        { error: "Missing duplicate key." },
        { status: 400 }
      );
    }

    if (!ALLOWED_DUPLICATE_TYPES.has(duplicateType)) {
      return NextResponse.json(
        { error: "Duplicate type must be food or pet." },
        { status: 400 }
      );
    }

    if (!ALLOWED_REVIEW_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Duplicate review status is not supported." },
        { status: 400 }
      );
    }

    const result = await adminDuplicateReviewService.save({
      duplicateKey,
      duplicateType,
      status,
      notes: notes || undefined,
      chosenRecordId: chosenRecordId || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save duplicate review.",
      },
      { status: 500 }
    );
  }
}
