import { NextResponse } from "next/server";

import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { launchFeatures } from "@/lib/launch/features";
import { isMissingRetailPartnerSchemaError } from "@/lib/retail-partners/databaseErrors";
import type { RetailPartnerReferralDestination } from "@/types/retail-partner";

export const dynamic = "force-dynamic";

const DESTINATIONS = new Set<RetailPartnerReferralDestination>([
  "product",
  "website",
  "phone",
]);

type ReferralListingRow = {
  id: string;
  product_url: string | null;
  partner: {
    id: string;
    website_url: string | null;
    phone: string | null;
    subscription_status: string | null;
    subscription_expires_at: string | null;
  } | null;
};

function cleanText(value: unknown, maxLength = 100) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function hasCurrentSubscription(row: ReferralListingRow) {
  const status = row.partner?.subscription_status;
  if (status !== "active" && status !== "trial") return false;

  const expiresAt = row.partner?.subscription_expires_at;
  return !expiresAt || expiresAt >= new Date().toISOString().slice(0, 10);
}

function hasDestination(
  row: ReferralListingRow,
  destination: RetailPartnerReferralDestination
) {
  if (destination === "product") return Boolean(row.product_url);
  if (destination === "website") return Boolean(row.partner?.website_url);
  return Boolean(row.partner?.phone);
}

function privateJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (!launchFeatures.partnerStores) {
    return privateJson({ error: "Not found." }, 404);
  }

  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const listingId = cleanText(body.listingId, 80);
    const destination = cleanText(
      body.destination,
      20
    ) as RetailPartnerReferralDestination;

    if (!listingId || !DESTINATIONS.has(destination)) {
      return privateJson({ error: "Invalid referral event." }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("retail_partner_product_availability")
      .select(
        "id,product_url,partner:retail_partners!inner(id,website_url,phone,subscription_status,subscription_expires_at)"
      )
      .eq("id", listingId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    const listing = data as unknown as ReferralListingRow | null;
    if (
      !listing?.partner ||
      !hasCurrentSubscription(listing) ||
      !hasDestination(listing, destination)
    ) {
      return privateJson({ error: "Referral target is not available." }, 404);
    }

    const { error: insertError } = await supabaseAdmin
      .from("retail_partner_referral_events")
      .insert({
        partner_id: listing.partner.id,
        availability_id: listing.id,
        destination,
        source: "chatbot_purchase_options",
      });

    if (insertError) throw insertError;

    return privateJson({ accepted: true }, 202);
  } catch (error) {
    if (isMissingRetailPartnerSchemaError(error)) {
      return privateJson({ error: "Referral measurement is not ready." }, 503);
    }

    return privateJson(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record partner referral.",
      },
      500
    );
  }
}
