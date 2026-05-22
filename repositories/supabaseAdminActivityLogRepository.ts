import { supabase } from "@/lib/db/supabase";
import {
  mapAdminActivityLogToDbAdminActivityLog,
  mapDbAdminActivityLogToAdminActivityLog,
} from "@/mappers/adminActivityLogMapper";
import type { AdminActivityLog } from "@/types/admin-activity-log";
import type { DbAdminActivityLog } from "@/types/db/db-admin-activity-log";

export const supabaseAdminActivityLogRepository = {
  async create(log: AdminActivityLog) {
    const dbLog = mapAdminActivityLogToDbAdminActivityLog(log);

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .insert(dbLog)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to save admin activity log:", error);
      throw new Error("Failed to save admin activity log.");
    }

    return mapDbAdminActivityLogToAdminActivityLog(data as DbAdminActivityLog);
  },

  async getAll() {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load admin activity logs:", error);
      throw new Error("Failed to load admin activity logs.");
    }

    return (data as DbAdminActivityLog[]).map(
      mapDbAdminActivityLogToAdminActivityLog
    );
  },
};