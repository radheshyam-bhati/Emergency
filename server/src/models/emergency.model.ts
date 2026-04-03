import { getDb } from "../db/client.js";
import {
  mapEmergency,
  type EmergencyRecord,
  type EmergencyRow,
  type EmergencySeverity,
  type EmergencyStatus,
  type QueueReason,
} from "../utils/mappers.js";
import { nowIso } from "../utils/time.js";

interface CreateEmergencyInput {
  patientName: string;
  patientPhone?: string;
  condition: string;
  severity: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  createdByUserId: number;
}

export const emergencyModel = {
  list(): EmergencyRecord[] {
    const rows = getDb()
      .prepare<EmergencyRow>("SELECT * FROM emergencies ORDER BY created_at DESC")
      .all();
    return rows.map(mapEmergency);
  },

  listQueued(): EmergencyRecord[] {
    const rows = getDb()
      .prepare<EmergencyRow>("SELECT * FROM emergencies WHERE status = 'queued' ORDER BY created_at ASC")
      .all();
    return rows.map(mapEmergency);
  },

  getById(id: number): EmergencyRecord | null {
    const row = getDb().prepare<EmergencyRow>("SELECT * FROM emergencies WHERE id = ?").get(id);
    return row ? mapEmergency(row) : null;
  },

  create(input: CreateEmergencyInput): EmergencyRecord {
    const now = nowIso();
    const result = getDb()
      .prepare(`
        INSERT INTO emergencies (
          patient_name, patient_phone, condition, severity, pickup_address,
          pickup_latitude, pickup_longitude, status, queue_reason,
          created_by_user_id, assigned_hospital_id, assigned_ambulance_id,
          created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, NULL, NULL, ?, ?, NULL)
      `)
      .run(
        input.patientName,
        input.patientPhone ?? null,
        input.condition,
        input.severity,
        input.pickupAddress,
        input.pickupLatitude,
        input.pickupLongitude,
        input.createdByUserId,
        now,
        now,
      );

    return this.getById(Number(result.lastInsertRowid))!;
  },

  markAssigned(id: number, ambulanceId: number | null, hospitalId: number | null) {
    getDb()
      .prepare(`
        UPDATE emergencies
        SET status = 'assigned',
            queue_reason = NULL,
            assigned_ambulance_id = ?,
            assigned_hospital_id = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(ambulanceId, hospitalId, nowIso(), id);
  },

  markQueued(id: number, queueReason: Exclude<QueueReason, null>) {
    getDb()
      .prepare("UPDATE emergencies SET status = 'queued', queue_reason = ?, updated_at = ? WHERE id = ?")
      .run(queueReason, nowIso(), id);
  },

  updateStatus(id: number, status: EmergencyStatus) {
    getDb()
      .prepare(`
        UPDATE emergencies
        SET status = ?, updated_at = ?, completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END
        WHERE id = ?
      `)
      .run(status, nowIso(), status, status === "completed" ? nowIso() : null, id);
  },
};
