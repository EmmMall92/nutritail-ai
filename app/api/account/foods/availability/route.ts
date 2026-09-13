import { NextResponse } from "next/server";

import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { launchFeatures } from "@/lib/launch/features";
import {
  PARTNER_DISCLOSURE_EL,
  rankEligiblePartnerAvailability,
  RETAIL_PARTNER_RANKING_VERSION,
  type PartnerAvailabilityRow,
} from "@/lib/retail-partners/ranking";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  if (!launchFeatures.partnerStores) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  const { searchParams } = new URL(request.url);
  const foodProductId = cleanText(searchParams.get("foodProductId"));
  const area = cleanText(searchParams.get("area"));

  if (!foodProductId) {
    return NextResponse.json(
      { error: "Missing foodProductId." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("retail_partner_product_availability")
    .select(
      [
        "id",
        "channel",
        "availability_status",
        "product_url",
        "estimated_price_euro",
        "is_sponsored",
        "display_priority",
        "partner:retail_partners!inner(id,name,city,area,postal_code,address,website_url,phone,channel,subscription_status,subscription_expires_at)",
      ].join(",")
    )
    .eq("food_product_id", foodProductId)
    .eq("is_active", true)
    .in("partner.subscription_status", ["active", "trial"])
    .order("id", { ascending: true });

  if (error) {
    const relationMissing =
      error.code === "42P01" ||
      error.message.toLowerCase().includes("does not exist");

    if (relationMissing) {
      return NextResponse.json({
        options: [],
        total: 0,
        partnerDisclosure: PARTNER_DISCLOSURE_EL,
        rankingVersion: RETAIL_PARTNER_RANKING_VERSION,
        rankingPolicyUrl: "/store-ranking",
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = rankEligiblePartnerAvailability(
    (data ?? []) as unknown as PartnerAvailabilityRow[],
    { area }
  ).slice(0, 12);

  return NextResponse.json({
    options: rows.map((row) => ({
      id: row.id,
      partnerName: row.partner?.name ?? "Partner store",
      channel: row.channel ?? row.partner?.channel ?? "online",
      city: row.partner?.city ?? null,
      area: row.partner?.area ?? null,
      address: row.partner?.address ?? null,
      websiteUrl: row.partner?.website_url ?? null,
      productUrl: row.product_url ?? null,
      phone: row.partner?.phone ?? null,
      availabilityStatus: row.availability_status ?? "unknown",
      isSponsored: row.is_sponsored === true,
      estimatedPriceEuro: numberOrNull(row.estimated_price_euro),
    })),
    total: rows.length,
    partnerDisclosure: PARTNER_DISCLOSURE_EL,
    rankingVersion: RETAIL_PARTNER_RANKING_VERSION,
    rankingPolicyUrl: "/store-ranking",
  });
}
