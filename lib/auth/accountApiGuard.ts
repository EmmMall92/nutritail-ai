import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

type AccountApiAccess =
  | { user: User; response: null }
  | { user: null; response: NextResponse };

export async function requireAccountApiUser(
  requestedAuthUserId?: unknown
): Promise<AccountApiAccess> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const requestedId = String(requestedAuthUserId ?? "").trim();
  if (requestedId && requestedId !== user.id) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
