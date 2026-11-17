import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, resetDb } from "./client.js";
import {
  seedActivityLogs,
  seedAmbulances,
  seedDispatches,
  seedEmergencies,
  seedHospitals,
  seedUsers,
} from "./seed-data.js";
import { nowIso } from "../utils/time.js";

export const seedDatabase = ({ reset = false }: { reset?: boolean } = {}) => {
  if (reset) {
    resetDb();
  }

  const activeDb = getDb();
  const userCount = (activeDb.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count;
  const hospitalCount = (activeDb.prepare("SELECT COUNT(*) AS count FROM hospitals").get() as { count: number }).count;

  if (userCount > 0 || hospitalCount > 0) {
    return;
  }

  const insertUser = activeDb.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, created_at)
    VALUES (@email, @passwordHash, @fullName, @role, @createdAt)
  `);
  const insertHospital = activeDb.prepare(`
    INSERT INTO hospitals (
      name, location, lat, lng, type, status, rating,
      icu_total, icu_available, er_total, er_available, general_total, general_available,
      ventilator_total, ventilator_available, doctors_total, doctors_available,
      specializations_json, created_at, updated_at
    ) VALUES (
      @name, @location, @lat, @lng, @type, @status, @rating,
      @icuTotal, @icuAvailable, @erTotal, @erAvailable, @generalTotal, @generalAvailable,
      @ventilatorTotal, @ventilatorAvailable, @doctorsTotal, @doctorsAvailable,
      @specializationsJson, @createdAt, @updatedAt
    )
  `);
  const insertAmbulance = activeDb.prepare(`
    INSERT INTO ambulances (
      vehicle_number, type, status, crew_name, lat, lng,
      current_hospital_id, current_emergency_id, last_seen_at, created_at, updated_at
    ) VALUES (
      @vehicleNumber, @type, @status, @crewName, @lat, @lng,
      @currentHospitalId, @currentEmergencyId, @lastSeenAt, @createdAt, @updatedAt
    )
  `);
  const updateAmbulanceEmergency = activeDb.prepare(`
    UPDATE ambulances
    SET current_emergency_id = @currentEmergencyId, updated_at = @updatedAt
    WHERE id = @id
  `);
  const insertEmergency = activeDb.prepare(`
    INSERT INTO emergencies (
      patient_name, patient_phone, condition, severity, pickup_address,
      pickup_latitude, pickup_longitude, status, queue_reason,
      created_by_user_id, assigned_hospital_id, assigned_ambulance_id,
      created_at, updated_at, completed_at
    ) VALUES (
      @patientName, @patientPhone, @condition, @severity, @pickupAddress,
      @pickupLatitude, @pickupLongitude, @status, @queueReason,
      @createdByUserId, @assignedHospitalId, @assignedAmbulanceId,
      @createdAt, @updatedAt, @completedAt
    )
  `);
  const insertDispatch = activeDb.prepare(`
    INSERT INTO dispatches (
      emergency_id, ambulance_id, hospital_id, score, distance_km, eta_minutes,
      ranking_snapshot_json, status, queue_reason, dispatched_at, en_route_at,
      arrived_at, completed_at, created_at, updated_at
    ) VALUES (
      @emergencyId, @ambulanceId, @hospitalId, @score, @distanceKm, @etaMinutes,
      @rankingSnapshotJson, @status, @queueReason, @dispatchedAt, @enRouteAt,
      @arrivedAt, @completedAt, @createdAt, @updatedAt
    )
  `);
  const insertLog = activeDb.prepare(`
    INSERT INTO activity_logs (entity_type, entity_id, event_type, message, metadata_json, created_at)
    VALUES (@entityType, @entityId, @eventType, @message, @metadataJson, @createdAt)
  `);

  const seedTransaction = activeDb.transaction(() => {
    seedUsers.forEach((user) => insertUser.run(user));

    seedHospitals.forEach((hospital) =>
      insertHospital.run({
        ...hospital,
        specializationsJson: JSON.stringify(hospital.specializations),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    );

    seedAmbulances.forEach((ambulance, index) =>
      insertAmbulance.run({
        ...ambulance,
        currentHospitalId: index === 3 ? 1 : null,
        currentEmergencyId: null,
        lastSeenAt: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    );

    seedEmergencies.forEach((emergency) =>
      insertEmergency.run({
        ...emergency,
        createdByUserId: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        completedAt: null,
      }),
    );

    [
      { id: 1, currentEmergencyId: 1 },
      { id: 3, currentEmergencyId: 2 },
      { id: 6, currentEmergencyId: 3 },
    ].forEach((assignment) =>
      updateAmbulanceEmergency.run({
        ...assignment,
        updatedAt: nowIso(),
      }),
    );

    seedDispatches.forEach((dispatch) =>
      insertDispatch.run({
        ...dispatch,
        rankingSnapshotJson: JSON.stringify(dispatch.rankingSnapshot),
        dispatchedAt: nowIso(),
        enRouteAt: dispatch.status === "in-transit" || dispatch.status === "arrived" ? nowIso() : null,
        arrivedAt: dispatch.status === "arrived" ? nowIso() : null,
        completedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    );

    seedActivityLogs.forEach((log) =>
      insertLog.run({
        ...log,
        metadataJson: null,
        createdAt: nowIso(),
      }),
    );
  });

  seedTransaction();
};

const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  seedDatabase({ reset: process.argv.includes("--reset") });
  console.log("Database seeded");
}
