import { supabaseAdminActivityLogRepository } from "@/repositories/supabaseAdminActivityLogRepository";
import type { AdminActivityLog } from "@/types/admin-activity-log";

type LogInput = {
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export const adminActivityLogService = {
  async log(input: LogInput) {
    const log: AdminActivityLog = {
      id: crypto.randomUUID(),
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    return supabaseAdminActivityLogRepository.create(log);
  },

  async getAll() {
    return supabaseAdminActivityLogRepository.getAll();
  },
};