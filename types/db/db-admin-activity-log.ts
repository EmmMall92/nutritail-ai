export type DbAdminActivityLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};