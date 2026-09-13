import nextEnv from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.NUTRITAIL_QA_BASE_URL ?? "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase QA environment variables are missing.");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Date.now();
const email = `partner-referral-live-${stamp}@example.com`;
const password = `PartnerReferral-${stamp}!`;
let userId = null;
let partnerId = null;

try {
  const { data: food, error: foodError } = await admin
    .from("food_products_v2")
    .select("id")
    .eq("is_recommendable", true)
    .limit(1)
    .maybeSingle();
  if (foodError) throw foodError;
  assert(food?.id, "A recommendable Food V2 row is required for live QA.");

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Partner Referral Live QA" },
    });
  if (authError) throw authError;
  userId = authData.user.id;

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email,
    role: "admin",
    full_name: "Partner Referral Live QA",
    created_at: now,
    updated_at: now,
  });
  if (profileError) throw profileError;

  const { data: partner, error: partnerError } = await admin
    .from("retail_partners")
    .insert({
      name: `Partner Referral Live QA ${stamp}`,
      legal_name: "Partner Referral Live QA",
      channel: "online",
      website_url: "https://example.com/store",
      phone: "+300000000000",
      contact_email: email,
      subscription_status: "active",
      subscription_started_at: "2026-08-17",
      subscription_expires_at: "2026-12-31",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (partnerError) throw partnerError;
  partnerId = partner.id;

  const { data: listing, error: listingError } = await admin
    .from("retail_partner_product_availability")
    .insert({
      partner_id: partnerId,
      food_product_id: food.id,
      channel: "online",
      availability_status: "in_stock",
      product_url: "https://example.com/store/exact-product",
      is_active: true,
      is_sponsored: true,
      display_priority: 10,
      last_verified_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (listingError) throw listingError;

  const cookieJar = new Map();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return [...cookieJar].map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          if (cookie.value) cookieJar.set(cookie.name, cookie.value);
          else cookieJar.delete(cookie.name);
        }
      },
    },
  });

  const { error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const cookieHeader = [...cookieJar]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  assert(cookieHeader, "Authenticated cookie jar was not created.");

  for (const destination of ["product", "website", "phone"]) {
    const response = await fetch(
      `${baseUrl}/api/account/retail-partner-referrals`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ listingId: listing.id, destination }),
      }
    );
    assert(
      response.status === 202,
      `Referral API returned ${response.status} for ${destination}: ${await response.text()}`
    );
  }

  const { data: events, error: eventError } = await admin
    .from("retail_partner_referral_events")
    .select("*")
    .eq("partner_id", partnerId)
    .order("destination", { ascending: true });
  if (eventError) throw eventError;
  assert(events.length === 3, "Live QA should create exactly three referrals.");

  const allowedColumns = [
    "availability_id",
    "destination",
    "id",
    "occurred_at",
    "partner_id",
    "source",
  ];
  for (const event of events) {
    assert(
      JSON.stringify(Object.keys(event).sort()) === JSON.stringify(allowedColumns),
      "Referral event contains an unexpected column."
    );
  }

  const adminResponse = await fetch(`${baseUrl}/api/admin/retail-partners`, {
    headers: { Cookie: cookieHeader },
  });
  if (adminResponse.status !== 200) {
    throw new Error(
      `Partner admin API returned ${adminResponse.status}: ${await adminResponse.text()}`
    );
  }
  const adminPayload = await adminResponse.json();
  const testedPartner = adminPayload.partners?.find(
    (candidate) => candidate.id === partnerId
  );
  assert(testedPartner, "Temporary partner was not returned by the admin API.");
  assert(
    testedPartner.referralMetrics?.total30d === 3 &&
      testedPartner.referralMetrics?.product30d === 1 &&
      testedPartner.referralMetrics?.website30d === 1 &&
      testedPartner.referralMetrics?.phone30d === 1,
    "Admin referral metrics do not match the live events."
  );

  console.log(
    "Partner referral live QA passed: authenticated writes, anonymous schema, rolling metrics, and admin API aggregation are working."
  );
} finally {
  if (partnerId) {
    await admin.from("retail_partners").delete().eq("id", partnerId);
  }
  if (userId) {
    await admin.from("customers").delete().eq("auth_user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId, false);
  }
}
