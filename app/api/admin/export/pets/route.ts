import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";

export async function GET() {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export pets.",
      },
      { status: 500 }
    );
  }
}
