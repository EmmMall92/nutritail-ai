import { NextResponse } from "next/server";
import { extractPetIntakeFacts } from "@/lib/ai/intakeExtractor";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

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
    const message = String(body.message ?? "").trim();
    const locale = body.locale === "en" ? "en" : "el";

    if (!message) {
      return NextResponse.json(
        { error: "Missing message." },
        { status: 400 }
      );
    }

    if (message.length > 1200) {
      return NextResponse.json(
        { error: "Message is too long for intake extraction." },
        { status: 400 }
      );
    }

    const result = await extractPetIntakeFacts(message, {
      locale,
      timeoutMs: 8000,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract intake facts.",
      },
      { status: 500 }
    );
  }
}
