import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { mapDbCustomerToCustomer } from "@/mappers/customerMapper";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import type { DbCustomer } from "@/types/db/db-customer";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const { data: pets, error: petsError } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("customer_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (petsError) {
      return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    const petsWithHistory = await Promise.all(
      (pets ?? []).map(async (pet) => {
        const history = await petAnalysisHistoryService.getPetHistory(String(pet.id));

        return {
          ...pet,
          analysisHistory: history,
        };
      })
    );

    return NextResponse.json({
      customer: mapDbCustomerToCustomer(customer as DbCustomer),
      pets: petsWithHistory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load customer.",
      },
      { status: 500 }
    );
  }
}