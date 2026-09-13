import { NextResponse } from "next/server";
import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const access = await requireAccountApiUser();
    if (access.response) return access.response;

    const { id } = await context.params;

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", access.user.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (!customer) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load pet.",
      },
      { status: 500 }
    );
  }
}
