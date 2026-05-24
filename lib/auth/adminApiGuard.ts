import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

const ADMIN_ROLES: UserRole[] = ["admin", "staff"];

export async function requireAdminApiAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to verify admin access." },
      { status: 500 }
    );
  }

  if (!profile || !ADMIN_ROLES.includes(profile.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}
