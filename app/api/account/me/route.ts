import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { mapDbCustomerToCustomer } from "@/mappers/customerMapper";
import type { DbCustomer } from "@/types/db/db-customer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const authUserId = String(body.authUserId ?? "");
    const email = body.email ? String(body.email) : null;
    const fullName = body.fullName ? String(body.fullName) : email ?? "Customer";

    if (!authUserId) {
      return NextResponse.json(
        { error: "Missing auth user id." },
        { status: 400 }
      );
    }

    const { data: existingCustomer, error: existingError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingCustomer) {
      return NextResponse.json(
        mapDbCustomerToCustomer(existingCustomer as DbCustomer)
      );
    }

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

    return NextResponse.json(mapDbCustomerToCustomer(newCustomer as DbCustomer));
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