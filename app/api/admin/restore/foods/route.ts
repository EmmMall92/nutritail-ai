import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Restore payload must be an array." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("foods")
      .upsert(body)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "restore",
      entityType: "food",
      entityId: "bulk-restore",
      message: `Restored ${data?.length ?? 0} food records`,
      metadata: {
        restored: data?.length ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      restored: data?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to restore foods.",
      },
      { status: 500 }
    );
  }
}