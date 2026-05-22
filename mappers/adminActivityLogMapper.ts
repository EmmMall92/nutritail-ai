import type { DbAdminActivityLog } from "@/types/db/db-admin-activity-log";
import type { AdminActivityLog } from "@/types/admin-activity-log";

export function mapDbAdminActivityLogToAdminActivityLog(
  db: DbAdminActivityLog
): AdminActivityLog {
  return {
    id: db.id,
    action: db.action,
    entityType: db.entity_type,
    entityId: db.entity_id,
    message: db.message,
    metadata: db.metadata ?? {},
    createdAt: db.created_at,
  };
}

export function mapAdminActivityLogToDbAdminActivityLog(
  log: AdminActivityLog
): DbAdminActivityLog {
  return {
    id: log.id,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    message: log.message,
    metadata: log.metadata ?? {},
    created_at: log.createdAt,
  };
}