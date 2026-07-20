import { NextResponse } from "next/server";
import { normalizeSafeRedirectPath } from "@/lib/auth/safeRedirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = normalizeSafeRedirectPath(
    requestUrl.searchParams.get("next")
  );

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "confirmation");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "confirmation");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const destination = new URL(nextPath, requestUrl.origin);
  destination.searchParams.set("verified", "1");
  return NextResponse.redirect(destination);
}
