import { supabaseClient } from "@/lib/supabaseClient";
import type { Profile, UserRole } from "@/types/profile";

type DbProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    const user = sessionData.session.user;

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const profile = data as DbProfile;

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },
};