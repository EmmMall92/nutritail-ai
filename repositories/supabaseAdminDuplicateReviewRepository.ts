import { supabase } from "@/lib/db/supabase";
import {
  mapAdminDuplicateReviewToDbAdminDuplicateReview,
  mapDbAdminDuplicateReviewToAdminDuplicateReview,
} from "@/mappers/adminDuplicateReviewMapper";
import type { AdminDuplicateReview } from "@/types/admin-duplicate-review";
import type { DbAdminDuplicateReview } from "@/types/db/db-admin-duplicate-review";

export const supabaseAdminDuplicateReviewRepository = {
  async getByKeyAndType(duplicateKey: string, duplicateType: string) {
    const { data, error } = await supabase
      .from("admin_duplicate_reviews")
      .select("*")
      .eq("duplicate_key", duplicateKey)
      .eq("duplicate_type", duplicateType)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to load duplicate review.");
    }

    if (!data) return null;

    return mapDbAdminDuplicateReviewToAdminDuplicateReview(
      data as DbAdminDuplicateReview
    );
  },

  async upsert(review: AdminDuplicateReview) {
    const dbReview = mapAdminDuplicateReviewToDbAdminDuplicateReview(review);

    const { data, error } = await supabase
      .from("admin_duplicate_reviews")
      .upsert(dbReview)
      .select("*")
      .single();

    if (error) {
      throw new Error("Failed to save duplicate review.");
    }

    return mapDbAdminDuplicateReviewToAdminDuplicateReview(
      data as DbAdminDuplicateReview
    );
  },
};