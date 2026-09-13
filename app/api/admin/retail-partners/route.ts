import { NextResponse } from "next/server";

import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { isMissingRetailPartnerSchemaError } from "@/lib/retail-partners/databaseErrors";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type {
  RetailPartner,
  RetailPartnerAvailabilityStatus,
  RetailPartnerChannel,
  RetailPartnerListing,
  RetailPartnerReferralMetrics,
  RetailPartnerSubscriptionStatus,
} from "@/types/retail-partner";

export const dynamic = "force-dynamic";

type PartnerRow = {
  id: string;
  name: string;
  legal_name: string | null;
  channel: RetailPartnerChannel;
  city: string | null;
  area: string | null;
  postal_code: string | null;
  address: string | null;
  website_url: string | null;
  phone: string | null;
  contact_email: string | null;
  subscription_status: RetailPartnerSubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ListingRow = {
  id: string;
  partner_id: string;
  food_product_id: string;
  channel: RetailPartnerChannel;
  availability_status: RetailPartnerAvailabilityStatus;
  product_url: string | null;
  estimated_price_euro: number | string | null;
  is_active: boolean;
  is_sponsored: boolean;
  display_priority: number;
  last_verified_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FoodRow = {
  id: string;
  brand: string;
  display_name: string;
  species: string;
  format: string;
};

type ReferralMetricRow = {
  partner_id: string;
  total_referrals: number | string;
  product_referrals: number | string;
  website_referrals: number | string;
  phone_referrals: number | string;
  last_referral_at: string | null;
};

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

function mapListing(row: ListingRow, foodById: Map<string, FoodRow>): RetailPartnerListing {
  const food = foodById.get(row.food_product_id);
  const price = Number(row.estimated_price_euro);

  return {
    id: row.id,
    partnerId: row.partner_id,
    foodProductId: row.food_product_id,
    channel: row.channel,
    availabilityStatus: row.availability_status,
    productUrl: row.product_url,
    estimatedPriceEuro: Number.isFinite(price) ? price : null,
    isActive: row.is_active,
    isSponsored: row.is_sponsored,
    displayPriority: row.display_priority,
    lastVerifiedAt: row.last_verified_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    food: food
      ? {
          id: food.id,
          brand: food.brand,
          displayName: food.display_name,
          species: food.species,
          format: food.format,
        }
      : null,
  };
}

function mapPartner(
  row: PartnerRow,
  listingsByPartner: Map<string, RetailPartnerListing[]>,
  referralMetricsByPartner: Map<string, RetailPartnerReferralMetrics>
): RetailPartner {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    channel: row.channel,
    city: row.city,
    area: row.area,
    postalCode: row.postal_code,
    address: row.address,
    websiteUrl: row.website_url,
    phone: row.phone,
    contactEmail: row.contact_email,
    subscriptionStatus: row.subscription_status,
    subscriptionStartedAt: row.subscription_started_at,
    subscriptionExpiresAt: row.subscription_expires_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    referralMetrics: referralMetricsByPartner.get(row.id) ?? {
      total30d: 0,
      product30d: 0,
      website30d: 0,
      phone30d: 0,
      lastReferralAt: null,
    },
    listings: listingsByPartner.get(row.id) ?? [],
  };
}

export async function GET() {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const [partnerResult, listingResult, referralMetricResult] = await Promise.all([
      supabaseAdmin
        .from("retail_partners")
        .select("*")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("retail_partner_product_availability")
        .select("*")
        .order("display_priority", { ascending: true })
        .order("updated_at", { ascending: false }),
      supabaseAdmin.from("retail_partner_referral_metrics_30d").select("*"),
    ]);

    const schemaError =
      partnerResult.error ?? listingResult.error ?? referralMetricResult.error;
    if (isMissingRetailPartnerSchemaError(schemaError)) {
      return NextResponse.json({
        schemaReady: false,
        partners: [],
        summary: {
          totalPartners: 0,
          visiblePartners: 0,
          activeListings: 0,
          referrals30d: 0,
        },
      });
    }
    if (partnerResult.error) throw partnerResult.error;
    if (listingResult.error) throw listingResult.error;
    if (referralMetricResult.error) throw referralMetricResult.error;

    const listings = (listingResult.data ?? []) as ListingRow[];
    const foodIds = [...new Set(listings.map((listing) => listing.food_product_id))];
    const foodResult = foodIds.length
      ? await supabaseAdmin
          .from("food_products_v2")
          .select("id, brand, display_name, species, format")
          .in("id", foodIds)
      : { data: [] as FoodRow[], error: null };

    if (foodResult.error) throw foodResult.error;

    const foodById = new Map(
      ((foodResult.data ?? []) as FoodRow[]).map((food) => [food.id, food])
    );
    const listingsByPartner = new Map<string, RetailPartnerListing[]>();
    const referralMetricsByPartner = new Map<
      string,
      RetailPartnerReferralMetrics
    >();

    for (const row of listings) {
      const partnerListings = listingsByPartner.get(row.partner_id) ?? [];
      partnerListings.push(mapListing(row, foodById));
      listingsByPartner.set(row.partner_id, partnerListings);
    }

    for (const row of (referralMetricResult.data ?? []) as ReferralMetricRow[]) {
      referralMetricsByPartner.set(row.partner_id, {
        total30d: Number(row.total_referrals) || 0,
        product30d: Number(row.product_referrals) || 0,
        website30d: Number(row.website_referrals) || 0,
        phone30d: Number(row.phone_referrals) || 0,
        lastReferralAt: row.last_referral_at,
      });
    }

    const partners = ((partnerResult.data ?? []) as PartnerRow[]).map((row) =>
      mapPartner(row, listingsByPartner, referralMetricsByPartner)
    );

    return NextResponse.json({
      schemaReady: true,
      partners,
      summary: {
        totalPartners: partners.length,
        visiblePartners: partners.filter((partner) =>
          ["active", "trial"].includes(partner.subscriptionStatus)
        ).length,
        activeListings: listings.filter((listing) => listing.is_active).length,
        referrals30d: partners.reduce(
          (total, partner) => total + partner.referralMetrics.total30d,
          0
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load retail partners.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const body = (await request.json()) as Record<string, unknown>;
    const name = cleanText(body.name, 160);
    const channel = cleanText(body.channel) as RetailPartnerChannel;
    const subscriptionStatus = cleanText(
      body.subscriptionStatus
    ) as RetailPartnerSubscriptionStatus;

    if (!name) {
      return NextResponse.json(
        { error: "Partner name is required." },
        { status: 400 }
      );
    }
    if (!PARTNER_CHANNELS.has(channel)) {
      return NextResponse.json({ error: "Invalid partner channel." }, { status: 400 });
    }
    if (!SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
      return NextResponse.json(
        { error: "Invalid subscription status." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("retail_partners")
      .insert({
        name,
        legal_name: nullableText(body.legalName, 200),
        channel,
        city: nullableText(body.city, 120),
        area: nullableText(body.area, 120),
        postal_code: nullableText(body.postalCode, 20),
        address: nullableText(body.address, 300),
        website_url: normalizeUrl(body.websiteUrl),
        phone: nullableText(body.phone, 60),
        contact_email: nullableText(body.contactEmail, 200)?.toLowerCase() ?? null,
        subscription_status: subscriptionStatus,
        subscription_started_at: normalizeDate(body.subscriptionStartedAt),
        subscription_expires_at: normalizeDate(body.subscriptionExpiresAt),
        notes: nullableText(body.notes, 2_000),
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingRetailPartnerSchemaError(error)) {
        return NextResponse.json(
          { error: "Apply the retail partner migration before adding partners." },
          { status: 503 }
        );
      }
      throw error;
    }

    await adminActivityLogService.log({
      action: "create",
      entityType: "retail_partner",
      entityId: data.id,
      message: `Created retail partner ${data.name}`,
      metadata: { channel: data.channel, subscriptionStatus: data.subscription_status },
    });

    return NextResponse.json(
      mapPartner(data as PartnerRow, new Map(), new Map()),
      {
      status: 201,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create retail partner.";
    const isValidationError =
      message.includes("URL") || message.includes("YYYY-MM-DD");
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
