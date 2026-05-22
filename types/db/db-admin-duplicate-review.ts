export type DbAdminDuplicateReview = {
  id: string;
  duplicate_key: string;
  duplicate_type: string;
  status: string;
  notes: string | null;
  chosen_record_id: string | null;
  created_at: string;
  updated_at: string;
};