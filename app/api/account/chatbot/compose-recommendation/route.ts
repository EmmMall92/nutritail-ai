import { NextResponse } from "next/server";

import { composeChatbotRecommendationResponse } from "@/lib/ai/responseComposer";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Parameters<typeof composeChatbotRecommendationResponse>[0];
  const deterministicText = String(payload?.deterministicText ?? "");

  if (!deterministicText.trim()) {
    return NextResponse.json({ error: "Missing deterministicText" }, { status: 400 });
  }

  if (deterministicText.length > 8000) {
    return NextResponse.json({ error: "Recommendation text is too long" }, { status: 400 });
  }

  const result = await composeChatbotRecommendationResponse({
    ...payload,
    deterministicText,
    timeoutMs: 9000,
  });

  return NextResponse.json(result);
}
