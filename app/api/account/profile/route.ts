import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { mapDbCustomerToCustomer } from "@/mappers/customerMapper";
import type { DbCustomer } from "@/types/db/db-customer";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const authUserId = String(body.authUserId ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const bonusCardCode = body.bonusCardCode
      ? String(body.bonusCardCode).trim()
      : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!authUserId) {
      return NextResponse.json(
        { error: "Missing auth user id." },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    const { data: currentCustomer, error: currentCustomerError } =
      await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

    if (currentCustomerError) {
      return NextResponse.json(
        { error: currentCustomerError.message },
        { status: 500 }
      );
    }

    if (!currentCustomer) {
      return NextResponse.json(
        { error: "Customer profile not found." },
        { status: 404 }
      );
    }

    if (bonusCardCode) {
      const { data: bonusMatches, error: bonusMatchesError } =
        await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("bonus_card_code", bonusCardCode)
          .limit(5);

      if (bonusMatchesError) {
        return NextResponse.json(
          { error: bonusMatchesError.message },
          { status: 500 }
        );
      }

      const belongsToAnotherCustomer = (bonusMatches ?? []).some(
        (item) => item.id !== currentCustomer.id
      );

      if (belongsToAnotherCustomer) {
        return NextResponse.json(
          {
            error:
              "Αυτός ο κωδικός bonus card χρησιμοποιείται ήδη από άλλο λογαριασμό.",
          },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .update({
        full_name: fullName,
        phone,
        bonus_card_code: bonusCardCode,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentCustomer.id)
      .select("*")
      .single();

    if (error) {
      const message =
        error.code === "23505"
          ? "Αυτός ο κωδικός bonus card χρησιμοποιείται ήδη από άλλο λογαριασμό."
          : error.message;

      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(mapDbCustomerToCustomer(data as DbCustomer));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}