import { NextResponse } from "next/server";

import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type {
  RetailPartnerAvailabilityStatus,
  RetailPartnerChannel,
} from "@/types/retail-partner";

const PARTNER_CHANNELS = new Set<RetailPartnerChannel>([
  "local_store",
  "online",
  "both",
]);
const AVAILABILITY_STATUSES = new Set<RetailPartnerAvailabilityStatus>([
  "in_stock",
  "order_available",
  "unknown",
]);

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeUrl(value: unknown) {
  const text = cleanText(value, 2_000);
  if (!text) return null;
  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Product URL must use http or https.");
  }
  return url.toString();
}

function normalizePrice(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const price = Number(String(value).replace(",", "."));
  if (!Number.isFinite(price) || price < 0 || price > 100_000) {
    throw new Error("Estimated price must be a positive number.");
  }
  return Math.round(price * 100) / 100;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; availabilityId: string }> }
) {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const { id: partnerId, availabilityId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (Object.hasOwn(body, "channel")) {
      const channel = cleanText(body.channel) as RetailPartnerChannel;
      if (!PARTNER_CHANNELS.has(channel)) {
        return NextResponse.json(
          { error: "Invalid listing channel." },
          { status: 400 }
        );
      }
      payload.channel = channel;
    }
    if (Object.hasOwn(body, "availabilityStatus")) {
      const status = cleanText(
        body.availabilityStatus
      ) as RetailPartnerAvailabilityStatus;
      if (!AVAILABILITY_STATUSES.has(status)) {
        return NextResponse.json(
          { error: "Invalid availability status." },
          { status: 400 }
        );
      }
      payload.availability_status = status;
    }
    if (Object.hasOwn(body, "productUrl")) {
      payload.product_url = normalizeUrl(body.productUrl);
    }
    if (Object.hasOwn(body, "estimatedPriceEuro")) {
      payload.estimated_price_euro = normalizePrice(body.estimatedPriceEuro);
    }
    if (Object.hasOwn(body, "isActive")) {
      payload.is_active = body.isActive === true;
    }
    if (Object.hasOwn(body, "isSponsored")) {
      payload.is_sponsored = body.isSponsored === true;
    }
    if (body.markVerified === true) {
      payload.last_verified_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("retail_partner_product_availability")
      .update(payload)
      .eq("id", availabilityId)
      .eq("partner_id", partnerId)
      .select("id, is_active, is_sponsored, availability_status")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    await adminActivityLogService.log({
      action: "update",
      entityType: "retail_partner_listing",
      entityId: data.id,
      message: "Updated a retail partner food listing",
      metadata: {
        partnerId,
        isActive: data.is_active,
        isSponsored: data.is_sponsored,
        availabilityStatus: data.availability_status,
      },
    });

    return NextResponse.json({ success: true, listingId: data.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update food listing.";
    const isValidationError = message.includes("URL") || message.includes("price");
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
