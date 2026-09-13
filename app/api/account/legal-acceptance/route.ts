import { NextResponse } from "next/server";

import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { TERMS_VERSION } from "@/lib/legal/config";

export async function GET() {
  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  const { data, error } = await supabaseAdmin
    .from("customer_legal_acceptances")
    .select("accepted_at")
    .eq("auth_user_id", access.user.id)
    .eq("document_type", "terms")
    .eq("document_version", TERMS_VERSION)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to check the current Terms acceptance." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accepted: Boolean(data),
    version: TERMS_VERSION,
    acceptedAt: data?.accepted_at ?? null,
  });
}

export async function POST(request: Request) {
  const access = await requireAccountApiUser();
  if (access.response) return access.response;

  const body = (await request.json().catch(() => null)) as {
    accepted?: unknown;
  } | null;

  if (body?.accepted !== true) {
    return NextResponse.json(
      { error: "Explicit acceptance is required." },
      { status: 400 }
    );
  }

  const acceptedAt = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("customer_legal_acceptances")
    .upsert(
      {
        auth_user_id: access.user.id,
        document_type: "terms",
        document_version: TERMS_VERSION,
        accepted_at: acceptedAt,
        source: "reacceptance",
      },
      { onConflict: "auth_user_id,document_type,document_version" }
    );

  if (error) {
    return NextResponse.json(
      { error: "Failed to record the current Terms acceptance." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accepted: true,
    version: TERMS_VERSION,
    acceptedAt,
  });
}
