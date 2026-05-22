import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { mapDbCustomerToCustomer } from "@/mappers/customerMapper";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type { DbCustomer } from "@/types/db/db-customer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      ((data ?? []) as DbCustomer[]).map(mapDbCustomerToCustomer)
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load customers.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const payload = {
      full_name: String(body.fullName ?? "").trim(),
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      bonus_card_code: body.bonusCardCode
        ? String(body.bonusCardCode).trim()
        : null,
      notes: body.notes ? String(body.notes).trim() : null,
      created_at: now,
      updated_at: now,
    };

    if (!payload.full_name) {
      return NextResponse.json(
        { error: "Customer full name is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "create",
      entityType: "customer",
      entityId: data.id,
      message: `Created customer ${data.full_name}`,
      metadata: {
        email: data.email,
        bonusCardCode: data.bonus_card_code,
      },
    });

    return NextResponse.json(mapDbCustomerToCustomer(data as DbCustomer));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create customer.",
      },
      { status: 500 }
    );
  }
}