import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

const MAX_TEXT_LENGTH = 500;
const MAX_PATH_LENGTH = 240;
const MAX_USER_AGENT_LENGTH = 300;

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";
  return request.headers.get("x-real-ip") ?? "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = cleanText(body.message || "Client runtime error.");
    const source = cleanText(body.source || "client_error_boundary", 80);
    const path = cleanText(body.path || "", MAX_PATH_LENGTH);
    const digest = cleanText(body.digest || "", 120);
    const id = crypto.randomUUID();

    const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
      id,
      action: "client_runtime_error",
      entity_type: "runtime_monitoring",
      entity_id: id,
      message: "Client runtime error captured.",
      metadata: {
        source,
        message,
        path,
        digest,
        ip: cleanText(getRequestIp(request), 80),
        userAgent: cleanText(
          request.headers.get("user-agent"),
          MAX_USER_AGENT_LENGTH
        ),
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
            : "Failed to capture client runtime error.",
      },
      { status: 500 }
    );
  }
}
