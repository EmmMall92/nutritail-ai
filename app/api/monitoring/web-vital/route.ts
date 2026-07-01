import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

const MAX_TEXT_LENGTH = 300;
const ALLOWED_METRICS = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);
const ALLOWED_RATINGS = new Set(["needs_improvement", "poor"]);

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 1000) / 1000 : null;
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";
  return request.headers.get("x-real-ip") ?? "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = cleanText(body.name, 20).toUpperCase();
    const rating = cleanText(body.rating, 40);
    const value = cleanNumber(body.value);

    if (!ALLOWED_METRICS.has(name) || !ALLOWED_RATINGS.has(rating) || value === null) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const id = crypto.randomUUID();
    const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
      id,
      action: "web_vital_threshold",
      entity_type: "runtime_monitoring",
      entity_id: id,
      message: `${name} web vital needs attention.`,
      metadata: {
        source: "web_vitals_reporter",
        metricId: cleanText(body.id, 120),
        metricName: name,
        value,
        rating,
        path: cleanText(body.path, 240),
        navigationType: cleanText(body.navigationType, 80),
        ip: cleanText(getRequestIp(request), 80),
        userAgent: cleanText(request.headers.get("user-agent"), 300),
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
          error instanceof Error
            ? error.message
            : "Failed to capture web vital metric.",
      },
      { status: 500 }
    );
  }
}
