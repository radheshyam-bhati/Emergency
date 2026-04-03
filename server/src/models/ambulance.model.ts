import { getDb } from "../db/client.js";
import {
  mapAmbulance,
  type AmbulanceRecord,
  type AmbulanceRow,
  type AmbulanceStatus,
} from "../utils/mappers.js";
import { nowIso } from "../utils/time.js";

export const ambulanceModel = {
  list(): AmbulanceRecord[] {
    const rows = getDb()
      .prepare<AmbulanceRow>("SELECT * FROM ambulances ORDER BY vehicle_number ASC")
      .all();
    return rows.map(mapAmbulance);
  },

  listAvailable(): AmbulanceRecord[] {
    const rows = getDb()
      .prepare<AmbulanceRow>("SELECT * FROM ambulances WHERE status = 'available' ORDER BY updated_at ASC")
      .all();
    return rows.map(mapAmbulance);
  },

  getById(id: number): AmbulanceRecord | null {
    const row = getDb().prepare<AmbulanceRow>("SELECT * FROM ambulances WHERE id = ?").get(id);
    return row ? mapAmbulance(row) : null;
  },

  assignToEmergency(id: number, emergencyId: number, status: AmbulanceStatus = "assigned") {
    getDb()
      .prepare(`
        UPDATE ambulances
        SET status = ?, current_emergency_id = ?, last_seen_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(status, emergencyId, nowIso(), nowIso(), id);
  },

  updateLocation(id: number, lat: number, lng: number) {
    getDb()
      .prepare(`
        UPDATE ambulances
        SET lat = ?, lng = ?, last_seen_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(lat, lng, nowIso(), nowIso(), id);
  },

  releaseFromEmergency(id: number, hospitalId: number | null) {
    getDb()
      .prepare(`
        UPDATE ambulances
        SET status = 'available',
            current_emergency_id = NULL,
            current_hospital_id = ?,
            last_seen_at = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(hospitalId, nowIso(), nowIso(), id);
  },

  updateStatus(id: number, status: AmbulanceStatus) {
    getDb()
      .prepare("UPDATE ambulances SET status = ?, last_seen_at = ?, updated_at = ? WHERE id = ?")
      .run(status, nowIso(), nowIso(), id);
  },
};
