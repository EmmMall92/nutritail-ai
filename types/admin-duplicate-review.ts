export type AdminDuplicateReview = {
  id: string;
  duplicateKey: string;
  duplicateType: string;
  status: string;
  notes?: string;
  chosenRecordId?: string;
  createdAt: string;
  updatedAt: string;
};