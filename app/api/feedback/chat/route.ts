import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_TEXT_LENGTH = 500;
const MAX_CONTEXT_LENGTH = 4000;
const ALLOWED_EVENT_TYPES = new Set([
  "chat_helpfulness",
  "chat_followup_action",
  "failed_food_match",
  "food_choice_selected",
  "analysis_completed",
  "plan_saved",
]);
const ALLOWED_RATINGS = new Set([
  "helpful",
  "needs_review",
  "not_helpful",
  "unknown",
]);

function cleanText(value: unknown) {
  return String(value ?? "").trim().slice(0, MAX_TEXT_LENGTH);
}

function cleanMetadata(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const metadata = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      typeof item === "string" ? cleanText(item) : item,
    ])
  );

  const serialized = JSON.stringify(metadata);

  if (serialized.length > MAX_CONTEXT_LENGTH) {
    return {
      truncated: true,
      note: "Feedback context exceeded maximum stored length.",
    };
  }

  return metadata;
}

function getContextText(context: Record<string, unknown>, key: string) {
  const value = context[key];
  return typeof value === "string" ? cleanText(value) : "";
}

function getContextNumber(context: Record<string, unknown>, key: string) {
  const value = Number(context[key]);
  return Number.isFinite(value) ? value : null;
}

function buildCleanupMetadata({
  eventType,
  message,
  context,
}: {
  eventType: string;
  message: string;
  context: Record<string, unknown>;
}) {
  if (eventType !== "failed_food_match") return null;

  const query = getContextText(context, "currentFoodName") || message;
  const matchScore = getContextNumber(context, "matchScore");
  const confidence = getContextText(context, "matchConfidence") || "none";
  const priority =
    matchScore === null || matchScore < 20 || confidence === "none"
      ? "high"
      : matchScore < 50
        ? "medium"
        : "watch";

  return {
    type: "food_data_cleanup",
    query,
    priority,
    reason:
      confidence === "none"
        ? "No confident database match was found."
        : `Food match confidence was ${confidence}.`,
    matchScore,
    href: `/admin/food-backfill?${new URLSearchParams({
      search: query,
      source: "chat_feedback",
    }).toString()}`,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const rawEventType = cleanText(
      body.eventType || body.event_type || "chat_helpfulness"
    );
    const rawRating = cleanText(body.rating || "unknown");
    const eventType = ALLOWED_EVENT_TYPES.has(rawEventType)
      ? rawEventType
      : "chat_helpfulness";
    const rating = ALLOWED_RATINGS.has(rawRating) ? rawRating : "unknown";
    const message = cleanText(body.message);
    const context = cleanMetadata(body.context);
    const cleanup = buildCleanupMetadata({
      eventType,
      message,
      context,
    });
    const id = crypto.randomUUID();

    const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
      id,
      action: eventType,
      entity_type: "chatbot_feedback",
      entity_id: id,
      message:
        eventType === "failed_food_match"
          ? "Chatbot could not confidently match a food."
          : "Chatbot feedback captured.",
      metadata: {
        source: "account_chatbot",
        authUserId: user.id,
        eventType,
        rating,
        message,
        context,
        cleanup,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to record feedback.",
      },
      { status: 500 }
    );
  }
}
