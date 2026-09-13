import { NextResponse } from "next/server";

import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { isMissingRetailPartnerSchemaError } from "@/lib/retail-partners/databaseErrors";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type {
  RetailPartnerChannel,
  RetailPartnerSubscriptionStatus,
} from "@/types/retail-partner";

const PARTNER_CHANNELS = new Set<RetailPartnerChannel>([
  "local_store",
  "online",
  "both",
]);
const SUBSCRIPTION_STATUSES = new Set<RetailPartnerSubscriptionStatus>([
  "active",
  "inactive",
  "trial",
  "expired",
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
    throw new Error("Website URL must use http or https.");
  }
  return url.toString();
}

function normalizeDate(value: unknown) {
  const text = cleanText(value, 10);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("Subscription dates must use YYYY-MM-DD.");
  }
  return text;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (Object.hasOwn(body, "name")) {
      const name = cleanText(body.name, 160);
      if (!name) {
        return NextResponse.json(
          { error: "Partner name is required." },
          { status: 400 }
        );
      }
      payload.name = name;
    }

    if (Object.hasOwn(body, "channel")) {
      const channel = cleanText(body.channel) as RetailPartnerChannel;
      if (!PARTNER_CHANNELS.has(channel)) {
        return NextResponse.json(
          { error: "Invalid partner channel." },
          { status: 400 }
        );
      }
      payload.channel = channel;
    }

    if (Object.hasOwn(body, "subscriptionStatus")) {
      const status = cleanText(
        body.subscriptionStatus
      ) as RetailPartnerSubscriptionStatus;
      if (!SUBSCRIPTION_STATUSES.has(status)) {
        return NextResponse.json(
          { error: "Invalid subscription status." },
          { status: 400 }
        );
      }
      payload.subscription_status = status;
    }

    const textFields = [
      ["legalName", "legal_name", 200],
      ["city", "city", 120],
      ["area", "area", 120],
      ["postalCode", "postal_code", 20],
      ["address", "address", 300],
      ["phone", "phone", 60],
      ["contactEmail", "contact_email", 200],
      ["notes", "notes", 2_000],
    ] as const;

    for (const [bodyKey, databaseKey, maxLength] of textFields) {
      if (!Object.hasOwn(body, bodyKey)) continue;
      const value = nullableText(body[bodyKey], maxLength);
      payload[databaseKey] =
        bodyKey === "contactEmail" ? value?.toLowerCase() ?? null : value;
    }

    if (Object.hasOwn(body, "websiteUrl")) {
      payload.website_url = normalizeUrl(body.websiteUrl);
    }
    if (Object.hasOwn(body, "subscriptionStartedAt")) {
      payload.subscription_started_at = normalizeDate(body.subscriptionStartedAt);
    }
    if (Object.hasOwn(body, "subscriptionExpiresAt")) {
      payload.subscription_expires_at = normalizeDate(body.subscriptionExpiresAt);
    }

    const { data, error } = await supabaseAdmin
      .from("retail_partners")
      .update(payload)
      .eq("id", id)
      .select("id, name, channel, subscription_status")
      .maybeSingle();

    if (error) {
      if (isMissingRetailPartnerSchemaError(error)) {
        return NextResponse.json(
          { error: "Apply the retail partner migration before editing partners." },
          { status: 503 }
        );
      }
      throw error;
    }
    if (!data) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    await adminActivityLogService.log({
      action: "update",
      entityType: "retail_partner",
      entityId: data.id,
      message: `Updated retail partner ${data.name}`,
      metadata: {
        channel: data.channel,
        subscriptionStatus: data.subscription_status,
      },
    });

    return NextResponse.json({ success: true, partnerId: data.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update retail partner.";
    const isValidationError =
      message.includes("URL") || message.includes("YYYY-MM-DD");
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
