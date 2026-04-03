import { getDb } from "../db/client.js";
import {
  mapDispatch,
  type DispatchRow,
  type DispatchRoutePhase,
  type DispatchRecord,
  type DispatchStatus,
  type QueueReason,
  type RankingSnapshot,
} from "../utils/mappers.js";
import { nowIso } from "../utils/time.js";

interface CreateDispatchInput {
  emergencyId: number;
  ambulanceId: number | null;
  hospitalId: number | null;
  score: number | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  pickupEtaMinutes: number | null;
  transportEtaMinutes: number | null;
  rankingSnapshot: RankingSnapshot;
  status: DispatchStatus;
  queueReason: QueueReason;
  pickupRoute: [number, number][];
  hospitalRoute: [number, number][];
  routePhase: DispatchRoutePhase;
  routeProgress: number;
  retryCount: number;
  lastRetryAt: string | null;
  escalatedAt: string | null;
}

export const dispatchModel = {
  list(): DispatchRecord[] {
    const rows = getDb()
      .prepare<DispatchRow>("SELECT * FROM dispatches ORDER BY created_at DESC")
      .all();
    return rows.map(mapDispatch);
  },

  getByEmergencyId(emergencyId: number): DispatchRecord | null {
    const row = getDb()
      .prepare<DispatchRow>("SELECT * FROM dispatches WHERE emergency_id = ?")
      .get(emergencyId);
    return row ? mapDispatch(row) : null;
  },

  listActive(): DispatchRecord[] {
    const rows = getDb()
      .prepare<DispatchRow>("SELECT * FROM dispatches WHERE status IN ('assigned', 'in-transit', 'arrived', 'queued') ORDER BY created_at ASC")
      .all();
    return rows.map(mapDispatch);
  },

  create(input: CreateDispatchInput): DispatchRecord {
    const now = nowIso();
    const result = getDb()
      .prepare(`
        INSERT INTO dispatches (
          emergency_id, ambulance_id, hospital_id, score, distance_km, eta_minutes,
          pickup_eta_minutes, transport_eta_minutes, ranking_snapshot_json, status, queue_reason,
          pickup_route_json, hospital_route_json, route_phase, route_progress, retry_count, last_retry_at, escalated_at,
          dispatched_at, en_route_at, arrived_at, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)
      `)
      .run(
        input.emergencyId,
        input.ambulanceId,
        input.hospitalId,
        input.score,
        input.distanceKm,
        input.etaMinutes,
        input.pickupEtaMinutes,
        input.transportEtaMinutes,
        JSON.stringify(input.rankingSnapshot),
        input.status,
        input.queueReason,
        JSON.stringify(input.pickupRoute),
        JSON.stringify(input.hospitalRoute),
        input.routePhase,
        input.routeProgress,
        input.retryCount,
        input.lastRetryAt,
        input.escalatedAt,
        input.status === "assigned" ? now : null,
        now,
        now,
      );

    const row = getDb()
      .prepare<DispatchRow>("SELECT * FROM dispatches WHERE id = ?")
      .get(Number(result.lastInsertRowid));
    return mapDispatch(row);
  },

  updateDecision(input: CreateDispatchInput) {
    getDb()
      .prepare(`
        UPDATE dispatches
        SET ambulance_id = ?,
            hospital_id = ?,
            score = ?,
            distance_km = ?,
            eta_minutes = ?,
            pickup_eta_minutes = ?,
            transport_eta_minutes = ?,
            ranking_snapshot_json = ?,
            status = ?,
            queue_reason = ?,
            pickup_route_json = ?,
            hospital_route_json = ?,
            route_phase = ?,
            route_progress = ?,
            retry_count = ?,
            last_retry_at = ?,
            escalated_at = ?,
            dispatched_at = CASE WHEN ? = 'assigned' THEN COALESCE(dispatched_at, ?) ELSE dispatched_at END,
            updated_at = ?
        WHERE emergency_id = ?
      `)
      .run(
        input.ambulanceId,
        input.hospitalId,
        input.score,
        input.distanceKm,
        input.etaMinutes,
        input.pickupEtaMinutes,
        input.transportEtaMinutes,
        JSON.stringify(input.rankingSnapshot),
        input.status,
        input.queueReason,
        JSON.stringify(input.pickupRoute),
        JSON.stringify(input.hospitalRoute),
        input.routePhase,
        input.routeProgress,
        input.retryCount,
        input.lastRetryAt,
        input.escalatedAt,
        input.status,
        nowIso(),
        nowIso(),
        input.emergencyId,
      );
  },

  updateStatus(emergencyId: number, status: DispatchStatus) {
    getDb()
      .prepare(`
        UPDATE dispatches
        SET status = ?,
            en_route_at = CASE WHEN ? = 'in-transit' AND en_route_at IS NULL THEN ? ELSE en_route_at END,
            arrived_at = CASE WHEN ? = 'arrived' AND arrived_at IS NULL THEN ? ELSE arrived_at END,
            completed_at = CASE WHEN ? = 'completed' AND completed_at IS NULL THEN ? ELSE completed_at END,
            updated_at = ?
        WHERE emergency_id = ?
      `)
      .run(status, status, nowIso(), status, nowIso(), status, nowIso(), nowIso(), emergencyId);
  },

  updateTracking(
    emergencyId: number,
    input: {
      routePhase: DispatchRoutePhase;
      routeProgress: number;
      etaMinutes: number | null;
      pickupEtaMinutes: number | null;
      transportEtaMinutes: number | null;
    },
  ) {
    getDb()
      .prepare(`
        UPDATE dispatches
        SET route_phase = ?,
            route_progress = ?,
            eta_minutes = ?,
            pickup_eta_minutes = ?,
            transport_eta_minutes = ?,
            updated_at = ?
        WHERE emergency_id = ?
      `)
      .run(
        input.routePhase,
        input.routeProgress,
        input.etaMinutes,
        input.pickupEtaMinutes,
        input.transportEtaMinutes,
        nowIso(),
        emergencyId,
      );
  },

  updateRankingSnapshot(emergencyId: number, rankingSnapshot: RankingSnapshot) {
    getDb()
      .prepare("UPDATE dispatches SET ranking_snapshot_json = ?, updated_at = ? WHERE emergency_id = ?")
      .run(JSON.stringify(rankingSnapshot), nowIso(), emergencyId);
  },
};
