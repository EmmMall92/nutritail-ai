import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import {
  PRIVACY_POLICY_VERSION,
  PRIVACY_RETENTION,
} from "@/lib/privacy/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  const authUserId = access.user.id;
  const [
    customerResult,
    profileResult,
    preferencesResult,
    consentResult,
    legalAcceptanceResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from("customers")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("id,email,full_name,role,created_at,updated_at")
        .eq("id", authUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("customer_privacy_preferences")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("customer_consent_events")
        .select("id,category,granted,policy_version,source,created_at")
        .eq("auth_user_id", authUserId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("customer_legal_acceptances")
        .select("id,document_type,document_version,accepted_at,source,created_at")
        .eq("auth_user_id", authUserId)
        .order("accepted_at", { ascending: true }),
    ]);

  const initialError = [
    customerResult.error,
    profileResult.error,
    preferencesResult.error,
    consentResult.error,
    legalAcceptanceResult.error,
  ].find(Boolean);

  if (initialError) {
    return Response.json(
      { error: initialError.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const customer = customerResult.data;
  const petsResult = customer
    ? await supabaseAdmin
        .from("pets")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (petsResult.error) {
    return Response.json(
      { error: petsResult.error.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const pets = petsResult.data ?? [];
  const petIds = pets.map((pet) => pet.id);
  const analysesResult =
    petIds.length > 0
      ? await supabaseAdmin
          .from("pet_analyses")
          .select("*")
          .in("pet_id", petIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (analysesResult.error) {
    return Response.json(
      { error: analysesResult.error.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const relatedEntityIds = [customer?.id, ...petIds].filter(
    (value): value is string => Boolean(value)
  );
  const accountEmail = access.user.email?.trim().toLowerCase() ?? null;
  const [authLogsResult, entityLogsResult, emailLogsResult] = await Promise.all([
    supabaseAdmin
      .from("admin_activity_logs")
      .select("id,action,entity_type,entity_id,message,metadata,created_at")
      .contains("metadata", { authUserId })
      .order("created_at", { ascending: true }),
    relatedEntityIds.length > 0
      ? supabaseAdmin
          .from("admin_activity_logs")
          .select("id,action,entity_type,entity_id,message,metadata,created_at")
          .in("entity_id", relatedEntityIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    accountEmail
      ? supabaseAdmin
          .from("admin_activity_logs")
          .select("id,action,entity_type,entity_id,message,metadata,created_at")
          .eq("metadata->>email", accountEmail)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const activityError =
    authLogsResult.error ?? entityLogsResult.error ?? emailLogsResult.error;
  if (activityError) {
    return Response.json(
      { error: activityError.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const activityById = new Map<string, Record<string, unknown>>();
  for (const row of [
    ...(authLogsResult.data ?? []),
    ...(entityLogsResult.data ?? []),
    ...(emailLogsResult.data ?? []),
  ]) {
    activityById.set(row.id, row);
  }

  const exportedAt = new Date().toISOString();
  const exportPayload = {
    exportMetadata: {
      service: "Nutritail AI",
      exportedAt,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      format: "application/json",
      scope:
        "Server-side account data associated with the authenticated user at export time.",
    },
    account: {
      id: access.user.id,
      email: access.user.email ?? null,
      phone: access.user.phone ?? null,
      createdAt: access.user.created_at,
      updatedAt: access.user.updated_at,
      lastSignInAt: access.user.last_sign_in_at ?? null,
      userMetadata: access.user.user_metadata,
    },
    customer,
    profile: profileResult.data,
    pets,
    petAnalyses: analysesResult.data ?? [],
    privacyPreferences: preferencesResult.data,
    consentHistory: consentResult.data ?? [],
    legalAcceptances: legalAcceptanceResult.data ?? [],
    linkedActivity: Array.from(activityById.values()).sort((a, b) =>
      String(a.created_at).localeCompare(String(b.created_at))
    ),
    retention: PRIVACY_RETENTION,
  };

  const date = exportedAt.slice(0, 10);
  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="nutritail-data-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
