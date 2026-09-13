import { NextResponse } from "next/server";
import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { mapDbCustomerToCustomer } from "@/mappers/customerMapper";
import type { DbCustomer } from "@/types/db/db-customer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireAccountApiUser(body.authUserId);
    if (access.response) return access.response;

    const authUserId = access.user.id;
    const email = access.user.email?.trim() || null;
    const fullName = body.fullName
      ? String(body.fullName).trim()
      : email ?? "Customer";

    const { data: existingCustomer, error: existingError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    let customer = existingCustomer;

    if (!customer) {
      const now = new Date().toISOString();
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from("customers")
        .insert({
          auth_user_id: authUserId,
          email,
          full_name: fullName,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      customer = newCustomer;
    }

    return NextResponse.json(mapDbCustomerToCustomer(customer as DbCustomer));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load account profile.",
      },
      { status: 500 }
    );
  }
}
