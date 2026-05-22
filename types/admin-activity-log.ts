export type AdminActivityLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};