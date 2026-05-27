import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import { adminDuplicateReviewService } from "@/services/adminDuplicateReviewService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const SUPPORTED_DUPLICATE_TYPES = new Set(["pet", "food"]);

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();

    const duplicateType = String(body.duplicateType ?? "")
      .trim()
      .toLowerCase();
    const duplicateKey = String(body.duplicateKey ?? "").trim();
    const chosenRecordId = String(body.chosenRecordId ?? "").trim();
    const recordIds: string[] = Array.isArray(body.recordIds)
      ? Array.from(
          new Set(
            body.recordIds
              .map((id: unknown) => String(id).trim())
              .filter(Boolean)
          )
        )
      : [];

    if (!SUPPORTED_DUPLICATE_TYPES.has(duplicateType)) {
      return NextResponse.json(
        { error: "Only pet and food merge are supported." },
        { status: 400 }
      );
    }

    if (!duplicateKey || !chosenRecordId || recordIds.length < 2) {
      return NextResponse.json(
        { error: "Missing merge inputs." },
        { status: 400 }
      );
    }

    if (!recordIds.includes(chosenRecordId)) {
      return NextResponse.json(
        { error: "Chosen record must be part of the duplicate group." },
        { status: 400 }
      );
    }

    const idsToDelete = recordIds.filter((id: string) => id !== chosenRecordId);
    const tableName = duplicateType === "pet" ? "pets" : "foods";

    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    await adminDuplicateReviewService.save({
      duplicateKey,
      duplicateType,
      status: "merged",
      notes: `Merged duplicate ${duplicateType} group. Kept ${chosenRecordId}. Removed ${idsToDelete.join(", ")}`,
      chosenRecordId,
    });

    await adminActivityLogService.log({
      action: "merge",
      entityType: duplicateType,
      entityId: chosenRecordId,
      message: `Merged duplicate ${duplicateType} records into survivor ${chosenRecordId}`,
      metadata: {
        duplicateKey,
        chosenRecordId,
        deletedRecordIds: idsToDelete,
      },
    });

    return NextResponse.json({
      success: true,
      chosenRecordId,
      deletedRecordIds: idsToDelete,
      duplicateType,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to merge duplicates.",
      },
      { status: 500 }
    );
  }
}
