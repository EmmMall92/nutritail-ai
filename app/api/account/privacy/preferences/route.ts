import { NextResponse } from "next/server";

import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import {
  PRIVACY_DEFAULTS,
  PRIVACY_POLICY_VERSION,
} from "@/lib/privacy/config";
import type { CustomerPrivacyPreferences } from "@/types/privacy";

export const dynamic = "force-dynamic";

type PrivacyPreferenceRow = {
  policy_version: string;
  product_analytics_enabled: boolean;
  partner_offers_enabled: boolean;
  updated_at: string;
};

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function mapPreferences(
  row: PrivacyPreferenceRow | null
): CustomerPrivacyPreferences {
  return {
    policyVersion: row?.policy_version ?? PRIVACY_POLICY_VERSION,
    productAnalyticsEnabled:
      row?.product_analytics_enabled ??
      PRIVACY_DEFAULTS.productAnalyticsEnabled,
    partnerOffersEnabled:
      row?.partner_offers_enabled ?? PRIVACY_DEFAULTS.partnerOffersEnabled,
    updatedAt: row?.updated_at ?? null,
  };
}

export async function GET() {
  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  const { data, error } = await supabaseAdmin
    .from("customer_privacy_preferences")
    .select(
      "policy_version,product_analytics_enabled,partner_offers_enabled,updated_at"
    )
    .eq("auth_user_id", access.user.id)
    .maybeSingle();

  if (error) return privateJson({ error: error.message }, 500);

  return privateJson(mapPreferences(data as PrivacyPreferenceRow | null));
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const access = await requireAccountApiUser(body.authUserId);
    if (access.response) return access.response;

    if (
      typeof body.productAnalyticsEnabled !== "boolean" ||
      typeof body.partnerOffersEnabled !== "boolean"
    ) {
      return privateJson({ error: "Invalid privacy preferences." }, 400);
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("customer_privacy_preferences")
      .select(
        "policy_version,product_analytics_enabled,partner_offers_enabled,updated_at"
      )
      .eq("auth_user_id", access.user.id)
      .maybeSingle();

    if (currentError) return privateJson({ error: currentError.message }, 500);

    const previous = mapPreferences(current as PrivacyPreferenceRow | null);
    const now = new Date().toISOString();
    const next = {
      productAnalyticsEnabled: body.productAnalyticsEnabled,
      partnerOffersEnabled: body.partnerOffersEnabled,
    };

    const { data, error } = await supabaseAdmin
      .from("customer_privacy_preferences")
      .upsert(
        {
          auth_user_id: access.user.id,
          policy_version: PRIVACY_POLICY_VERSION,
          product_analytics_enabled: next.productAnalyticsEnabled,
          partner_offers_enabled: next.partnerOffersEnabled,
          updated_at: now,
        },
        { onConflict: "auth_user_id" }
      )
      .select(
        "policy_version,product_analytics_enabled,partner_offers_enabled,updated_at"
      )
      .single();

    if (error) return privateJson({ error: error.message }, 500);

    const events = [
      previous.productAnalyticsEnabled !== next.productAnalyticsEnabled
        ? {
            auth_user_id: access.user.id,
            category: "product_analytics",
            granted: next.productAnalyticsEnabled,
            policy_version: PRIVACY_POLICY_VERSION,
            source: "account_privacy_center",
          }
        : null,
      previous.partnerOffersEnabled !== next.partnerOffersEnabled
        ? {
            auth_user_id: access.user.id,
            category: "partner_offers",
            granted: next.partnerOffersEnabled,
            policy_version: PRIVACY_POLICY_VERSION,
            source: "account_privacy_center",
          }
        : null,
    ].filter((event): event is NonNullable<typeof event> => event !== null);

    if (events.length > 0) {
      const { error: eventError } = await supabaseAdmin
        .from("customer_consent_events")
        .insert(events);

      if (eventError) return privateJson({ error: eventError.message }, 500);
    }

    return privateJson(mapPreferences(data as PrivacyPreferenceRow));
  } catch (error) {
    return privateJson(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update privacy preferences.",
      },
      500
    );
  }
}
