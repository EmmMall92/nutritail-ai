import { NextResponse } from "next/server";

import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export const dynamic = "force-dynamic";

const DELETE_CONFIRMATION = "ΔΙΑΓΡΑΦΗ";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function errorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Account deletion failed.";
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const access = await requireAccountApiUser(body.authUserId);
    if (access.response) return access.response;

    if (String(body.confirmation ?? "").trim() !== DELETE_CONFIRMATION) {
      return privateJson({ error: "Invalid deletion confirmation." }, 400);
    }

    const authUserId = access.user.id;
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (customerError) return privateJson({ error: customerError.message }, 500);

    const petsResult = customer
      ? await supabaseAdmin
          .from("pets")
          .select("id")
          .eq("customer_id", customer.id)
      : { data: [], error: null };

    if (petsResult.error) {
      return privateJson({ error: petsResult.error.message }, 500);
    }

    const petIds = (petsResult.data ?? []).map((pet) => pet.id);
    const relatedEntityIds = [customer?.id, ...petIds].filter(
      (value): value is string => Boolean(value)
    );
    const accountEmail = access.user.email?.trim().toLowerCase() ?? null;

    const cleanupResults = await Promise.all([
      supabaseAdmin
        .from("admin_activity_logs")
        .delete()
        .contains("metadata", { authUserId }),
      relatedEntityIds.length > 0
        ? supabaseAdmin
            .from("admin_activity_logs")
            .delete()
            .in("entity_id", relatedEntityIds)
        : Promise.resolve({ error: null }),
      accountEmail
        ? supabaseAdmin
            .from("admin_activity_logs")
            .delete()
            .eq("metadata->>email", accountEmail)
        : Promise.resolve({ error: null }),
      petIds.length > 0
        ? supabaseAdmin.from("pet_analyses").delete().in("pet_id", petIds)
        : Promise.resolve({ error: null }),
    ]);

    const cleanupError = cleanupResults.find((result) => result.error)?.error;
    if (cleanupError) {
      return privateJson({ error: errorMessage(cleanupError) }, 500);
    }

    if (customer) {
      if (petIds.length > 0) {
        const { error } = await supabaseAdmin
          .from("pets")
          .delete()
          .in("id", petIds);
        if (error) return privateJson({ error: error.message }, 500);
      }

      const { error } = await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", customer.id);
      if (error) return privateJson({ error: error.message }, 500);
    }

    const privacyCleanupResults = await Promise.all([
      supabaseAdmin
        .from("customer_consent_events")
        .delete()
        .eq("auth_user_id", authUserId),
      supabaseAdmin
        .from("customer_privacy_preferences")
        .delete()
        .eq("auth_user_id", authUserId),
      supabaseAdmin
        .from("customer_legal_acceptances")
        .delete()
        .eq("auth_user_id", authUserId),
      supabaseAdmin.from("profiles").delete().eq("id", authUserId),
    ]);

    const privacyCleanupError = privacyCleanupResults.find(
      (result) => result.error
    )?.error;
    if (privacyCleanupError) {
      return privateJson({ error: errorMessage(privacyCleanupError) }, 500);
    }

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(authUserId, false);

    if (deleteAuthError) {
      return privateJson({ error: deleteAuthError.message }, 500);
    }

    return privateJson({ success: true });
  } catch (error) {
    return privateJson({ error: errorMessage(error) }, 500);
  }
}
