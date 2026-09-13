import { NextResponse } from "next/server";

import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { isMissingRetailPartnerSchemaError } from "@/lib/retail-partners/databaseErrors";
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

function nullableText(value: unknown, maxLength = 500) {
  const text = cleanText(value, maxLength);
  return text || null;
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

function normalizePriority(value: unknown) {
  const priority = Number(value ?? 100);
  if (!Number.isInteger(priority) || priority < 0 || priority > 10_000) {
    throw new Error("Display priority must be an integer from 0 to 10000.");
  }
  return priority;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const { id: partnerId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const foodProductId = cleanText(body.foodProductId, 80);
    const channel = cleanText(body.channel) as RetailPartnerChannel;
    const availabilityStatus = cleanText(
      body.availabilityStatus
    ) as RetailPartnerAvailabilityStatus;

    if (!foodProductId) {
      return NextResponse.json(
        { error: "Choose an exact Food V2 product." },
        { status: 400 }
      );
    }
    if (!PARTNER_CHANNELS.has(channel)) {
      return NextResponse.json({ error: "Invalid listing channel." }, { status: 400 });
    }
    if (!AVAILABILITY_STATUSES.has(availabilityStatus)) {
      return NextResponse.json(
        { error: "Invalid availability status." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("retail_partner_product_availability")
      .upsert(
        {
          partner_id: partnerId,
          food_product_id: foodProductId,
          channel,
          availability_status: availabilityStatus,
          product_url: normalizeUrl(body.productUrl),
          estimated_price_euro: normalizePrice(body.estimatedPriceEuro),
          is_active: body.isActive !== false,
          is_sponsored: body.isSponsored === true,
          display_priority: normalizePriority(body.displayPriority),
          last_verified_at: body.markVerified === false ? null : now,
          notes: nullableText(body.notes, 2_000),
          updated_at: now,
        },
        { onConflict: "partner_id,food_product_id,channel" }
      )
      .select("id, food_product_id, channel, availability_status")
      .single();

    if (error) {
      if (isMissingRetailPartnerSchemaError(error)) {
        return NextResponse.json(
          { error: "Apply the retail partner migration before adding listings." },
          { status: 503 }
        );
      }
      throw error;
    }

    await adminActivityLogService.log({
      action: "upsert",
      entityType: "retail_partner_listing",
      entityId: data.id,
      message: "Added or updated a retail partner food listing",
      metadata: {
        partnerId,
        foodProductId: data.food_product_id,
        channel: data.channel,
        availabilityStatus: data.availability_status,
      },
    });

    return NextResponse.json({ success: true, listingId: data.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save food listing.";
    const isValidationError =
      message.includes("URL") ||
      message.includes("price") ||
      message.includes("priority");
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
