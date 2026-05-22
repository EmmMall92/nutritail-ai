import type { DbAdminDuplicateReview } from "@/types/db/db-admin-duplicate-review";
import type { AdminDuplicateReview } from "@/types/admin-duplicate-review";

export function mapDbAdminDuplicateReviewToAdminDuplicateReview(
  db: DbAdminDuplicateReview
): AdminDuplicateReview {
  return {
    id: db.id,
    duplicateKey: db.duplicate_key,
    duplicateType: db.duplicate_type,
    status: db.status,
    notes: db.notes ?? undefined,
    chosenRecordId: db.chosen_record_id ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapAdminDuplicateReviewToDbAdminDuplicateReview(
  review: AdminDuplicateReview
): DbAdminDuplicateReview {
  return {
    id: review.id,
    duplicate_key: review.duplicateKey,
    duplicate_type: review.duplicateType,
    status: review.status,
    notes: review.notes ?? null,
    chosen_record_id: review.chosenRecordId ?? null,
    created_at: review.createdAt,
    updated_at: review.updatedAt,
  };
}