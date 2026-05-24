import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Preview payload must be an array." },
        { status: 400 }
      );
    }

    const ids = body
      .map((item) => item?.id)
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

    const { data, error } = await supabase
      .from("foods")
      .select("id")
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const existingIds = (data ?? []).map((item) => item.id);

    return NextResponse.json({
      total: body.length,
      ids: ids.slice(0, 20),
      existingIds,
      existingCount: existingIds.length,
      newCount: body.length - existingIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to preview restore.",
      },
      { status: 500 }
    );
  }
}