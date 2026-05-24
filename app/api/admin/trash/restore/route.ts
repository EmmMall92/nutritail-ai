import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();

    const type = String(body.type ?? "");
    const id = String(body.id ?? "");

    if (!["pet", "food"].includes(type) || !id) {
      return NextResponse.json({ error: "Invalid restore input." }, { status: 400 });
    }

    const tableName = type === "pet" ? "pets" : "foods";
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(tableName)
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "restore-soft-deleted",
      entityType: type,
      entityId: id,
      message: `Restored soft-deleted ${type} ${id}`,
      metadata: {
        restoredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      restoredId: id,
      type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore record." },
      { status: 500 }
    );
  }
}