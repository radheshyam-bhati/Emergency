import { getDb } from "../db/client.js";
import {
  mapHospital,
  type HospitalRecord,
  type HospitalRow,
  type HospitalStatus,
} from "../utils/mappers.js";
import { nowIso } from "../utils/time.js";

const getDoctorReservationCount = (severity: "critical" | "serious" | "moderate" | "minor") =>
  severity === "critical" ? 2 : severity === "minor" ? 0 : 1;

export const hospitalModel = {
  list(): HospitalRecord[] {
    const rows = getDb()
      .prepare<HospitalRow>("SELECT * FROM hospitals ORDER BY rating DESC, name ASC")
      .all();
    return rows.map(mapHospital);
  },

  listActive(): HospitalRecord[] {
    const rows = getDb()
      .prepare<HospitalRow>("SELECT * FROM hospitals WHERE status != 'offline' ORDER BY rating DESC, name ASC")
      .all();
    return rows.map(mapHospital);
  },

  getById(id: number): HospitalRecord | null {
    const row = getDb().prepare<HospitalRow>("SELECT * FROM hospitals WHERE id = ?").get(id);
    return row ? mapHospital(row) : null;
  },

  reserveResources(id: number, severity: "critical" | "serious" | "moderate" | "minor") {
    const doctorsToReserve = getDoctorReservationCount(severity);

    getDb()
      .prepare(`
        UPDATE hospitals
        SET
          er_available = MAX(0, er_available - 1),
          icu_available = CASE WHEN ? = 'critical' THEN MAX(0, icu_available - 1) ELSE icu_available END,
          ventilator_available = CASE WHEN ? = 'critical' THEN MAX(0, ventilator_available - 1) ELSE ventilator_available END,
          doctors_available = MAX(0, doctors_available - ?),
          updated_at = ?
        WHERE id = ?
      `)
      .run(severity, severity, doctorsToReserve, nowIso(), id);
  },

  releaseResources(id: number, severity: "critical" | "serious" | "moderate" | "minor") {
    const doctorsToRelease = getDoctorReservationCount(severity);

    getDb()
      .prepare(`
        UPDATE hospitals
        SET
          er_available = MIN(er_total, er_available + 1),
          icu_available = CASE WHEN ? = 'critical' THEN MIN(icu_total, icu_available + 1) ELSE icu_available END,
          ventilator_available = CASE WHEN ? = 'critical' THEN MIN(ventilator_total, ventilator_available + 1) ELSE ventilator_available END,
          doctors_available = MIN(doctors_total, doctors_available + ?),
          updated_at = ?
        WHERE id = ?
      `)
      .run(severity, severity, doctorsToRelease, nowIso(), id);
  },

  updateStatus(id: number, status: HospitalStatus) {
    getDb().prepare("UPDATE hospitals SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
  },
};
