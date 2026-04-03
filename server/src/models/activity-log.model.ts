import { getDb } from "../db/client.js";
import { mapActivityLog, type ActivityLogRecord, type ActivityLogRow } from "../utils/mappers.js";
import { nowIso } from "../utils/time.js";

export const activityLogModel = {
  list(limit = 20): ActivityLogRecord[] {
    const rows = getDb()
      .prepare<ActivityLogRow>("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?")
      .all(limit);
    return rows.map(mapActivityLog);
  },

  add(entityType: string, entityId: number | null, eventType: string, message: string, metadata?: Record<string, unknown>) {
    getDb()
      .prepare(`
        INSERT INTO activity_logs (entity_type, entity_id, event_type, message, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(entityType, entityId, eventType, message, metadata ? JSON.stringify(metadata) : null, nowIso());
  },
};
