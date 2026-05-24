import { NextResponse } from "next/server";
import { adminDuplicateReviewService } from "@/services/adminDuplicateReviewService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();

    const result = await adminDuplicateReviewService.save({
      duplicateKey: String(body.duplicateKey ?? ""),
      duplicateType: String(body.duplicateType ?? ""),
      status: String(body.status ?? "open"),
      notes: body.notes ? String(body.notes) : undefined,
      chosenRecordId: body.chosenRecordId
        ? String(body.chosenRecordId)
        : undefined,
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