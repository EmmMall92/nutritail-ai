import { supabaseAdminDuplicateReviewRepository } from "@/repositories/supabaseAdminDuplicateReviewRepository";
import type { AdminDuplicateReview } from "@/types/admin-duplicate-review";

type SaveInput = {
  duplicateKey: string;
  duplicateType: string;
  status: string;
  notes?: string;
  chosenRecordId?: string;
};

export const adminDuplicateReviewService = {
  async getByKeyAndType(duplicateKey: string, duplicateType: string) {
    return supabaseAdminDuplicateReviewRepository.getByKeyAndType(
      duplicateKey,
      duplicateType
    );
  },

  async save(input: SaveInput) {
    const existing = await supabaseAdminDuplicateReviewRepository.getByKeyAndType(
      input.duplicateKey,
      input.duplicateType
    );

    const review: AdminDuplicateReview = {
      id: existing?.id ?? crypto.randomUUID(),
      duplicateKey: input.duplicateKey,
      duplicateType: input.duplicateType,
      status: input.status,
      notes: input.notes,
      chosenRecordId: input.chosenRecordId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return supabaseAdminDuplicateReviewRepository.upsert(review);
  },
};