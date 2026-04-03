export type HospitalStatus = "operational" | "high-load" | "critical" | "offline";
export type AmbulanceStatus = "available" | "queued" | "assigned" | "en-route" | "at-hospital";
export type EmergencySeverity = "critical" | "serious" | "moderate" | "minor";
export type EmergencyStatus = "pending" | "queued" | "assigned" | "in-transit" | "arrived" | "completed" | "cancelled";
export type DispatchStatus = "queued" | "assigned" | "in-transit" | "arrived" | "completed" | "cancelled";
export type QueueReason = "NO_AMBULANCE" | "NO_CAPABLE_HOSPITAL" | null;
export type DispatchFallbackStrategy = "nearest-available" | "waitlist" | "manual-escalation";
export type DispatchRoutePhase = "idle" | "to-patient" | "to-hospital" | "completed";
export type ReplayStepStatus = "success" | "warning" | "pending";

export interface ResourceState {
  total: number;
  available: number;
}

export interface UserRecord {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "dispatcher";
  createdAt: string;
}

export interface HospitalRecord {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: string;
  status: HospitalStatus;
  rating: number;
  icuBeds: ResourceState;
  emergencyBeds: ResourceState;
  generalBeds: ResourceState;
  ventilators: ResourceState;
  doctors: ResourceState;
  specializations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AmbulanceRecord {
  id: number;
  vehicleNumber: string;
  type: "ALS" | "BLS" | "Patient Transport";
  status: AmbulanceStatus;
  crew: string;
  lat: number;
  lng: number;
  currentHospitalId: number | null;
  currentEmergencyId: number | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyRecord {
  id: number;
  patientName: string;
  patientPhone: string | null;
  condition: string;
  severity: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  status: EmergencyStatus;
  queueReason: QueueReason;
  createdByUserId: number;
  assignedHospitalId: number | null;
  assignedAmbulanceId: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface HospitalDecision {
  hospitalId: number;
  name: string;
  totalScore: number;
  distanceKm: number;
  etaMinutes: number;
  recommended: boolean;
  breakdown: {
    distance: number;
    icu: number;
    er: number;
    doctors: number;
    specialization: number;
    severityWeight: number;
  };
  penalties: string[];
}

export interface DecisionFactors {
  distanceScore: number;
  pickupEtaMinutes: number;
  transportEtaMinutes: number;
  totalEtaMinutes: number;
  icuScore: number;
  erScore: number;
  doctorScore: number;
  specializationScore: number;
  severityBoost: number;
  penalties: number;
}

export interface RejectedOption {
  id: number;
  kind: "ambulance" | "hospital";
  name: string;
  reason: string;
}

export interface ReplayStep {
  code: string;
  title: string;
  detail: string;
  timestamp: string;
  status: ReplayStepStatus;
}

export interface RankingSnapshot {
  evaluatedAt: string;
  emergencySeverity: EmergencySeverity;
  chosenHospitalId: number | null;
  queueReason: QueueReason;
  score: number | null;
  factors: DecisionFactors | null;
  rejectedOptions: RejectedOption[];
  fallbackStrategy: DispatchFallbackStrategy;
  ranking: HospitalDecision[];
  replay: ReplayStep[];
}

export interface DispatchRecord {
  id: number;
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
  dispatchedAt: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogRecord {
  id: number;
  entityType: string;
  entityId: number | null;
  eventType: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "dispatcher";
  created_at: string;
}

export interface HospitalRow {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: string;
  status: HospitalStatus;
  rating: number;
  icu_total: number;
  icu_available: number;
  er_total: number;
  er_available: number;
  general_total: number;
  general_available: number;
  ventilator_total: number;
  ventilator_available: number;
  doctors_total: number;
  doctors_available: number;
  specializations_json: string;
  created_at: string;
  updated_at: string;
}

export interface AmbulanceRow {
  id: number;
  vehicle_number: string;
  type: "ALS" | "BLS" | "Patient Transport";
  status: AmbulanceStatus;
  crew_name: string;
  lat: number;
  lng: number;
  current_hospital_id: number | null;
  current_emergency_id: number | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyRow {
  id: number;
  patient_name: string;
  patient_phone: string | null;
  condition: string;
  severity: EmergencySeverity;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  status: EmergencyStatus;
  queue_reason: QueueReason;
  created_by_user_id: number;
  assigned_hospital_id: number | null;
  assigned_ambulance_id: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DispatchRow {
  id: number;
  emergency_id: number;
  ambulance_id: number | null;
  hospital_id: number | null;
  score: number | null;
  distance_km: number | null;
  eta_minutes: number | null;
  pickup_eta_minutes: number | null;
  transport_eta_minutes: number | null;
  ranking_snapshot_json: string;
  status: DispatchStatus;
  queue_reason: QueueReason;
  pickup_route_json: string | null;
  hospital_route_json: string | null;
  route_phase: DispatchRoutePhase | null;
  route_progress: number | null;
  retry_count: number | null;
  last_retry_at: string | null;
  escalated_at: string | null;
  dispatched_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogRow {
  id: number;
  entity_type: string;
  entity_id: number | null;
  event_type: string;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

type SnapshotLike = Partial<RankingSnapshot> & {
  hospitals?: HospitalDecision[];
  steps?: Array<{
    step?: string;
    status?: ReplayStepStatus;
    detail?: string;
    timestamp?: string;
  }>;
};

const normalizeReplay = (
  replay: RankingSnapshot["replay"] | SnapshotLike["steps"] | undefined,
): RankingSnapshot["replay"] => {
  if (!Array.isArray(replay)) {
    return [];
  }

  return replay.map((step, index) => {
    if ("code" in step && typeof step.code === "string") {
      return {
        code: step.code,
        title: step.title,
        detail: step.detail,
        timestamp: step.timestamp,
        status: step.status,
      };
    }

    const legacyStep = step as NonNullable<SnapshotLike["steps"]>[number];

    return {
      code: legacyStep.step ?? `step-${index + 1}`,
      title: (legacyStep.step ?? `Step ${index + 1}`).replace(/_/g, " "),
      detail: legacyStep.detail ?? "",
      timestamp: legacyStep.timestamp ?? new Date(0).toISOString(),
      status: legacyStep.status ?? "success",
    };
  });
};

const parseRoute = (value: string | null): [number, number][] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((point) => {
      if (!Array.isArray(point) || point.length < 2) {
        return [];
      }

      const [lat, lng] = point;
      return typeof lat === "number" && typeof lng === "number" ? [[lat, lng] as [number, number]] : [];
    });
  } catch {
    return [];
  }
};

export const normalizeDecisionSnapshot = (payload: string): RankingSnapshot => {
  const parsed = JSON.parse(payload) as SnapshotLike;
  const ranking = Array.isArray(parsed.ranking)
    ? parsed.ranking
    : Array.isArray(parsed.hospitals)
      ? parsed.hospitals
      : [];
  const chosenHospitalId =
    typeof parsed.chosenHospitalId === "number" ? parsed.chosenHospitalId : null;
  const selectedDecision =
    ranking.find((candidate) => candidate.hospitalId === chosenHospitalId) ?? ranking[0] ?? null;

  return {
    evaluatedAt: parsed.evaluatedAt ?? new Date(0).toISOString(),
    emergencySeverity: parsed.emergencySeverity ?? "moderate",
    chosenHospitalId,
    queueReason: parsed.queueReason ?? null,
    score: typeof parsed.score === "number" ? parsed.score : selectedDecision?.totalScore ?? null,
    factors: parsed.factors ?? null,
    rejectedOptions: Array.isArray(parsed.rejectedOptions) ? parsed.rejectedOptions : [],
    fallbackStrategy:
      parsed.fallbackStrategy ??
      (parsed.queueReason ? "waitlist" : "nearest-available"),
    ranking,
    replay: normalizeReplay(parsed.replay ?? parsed.steps),
  };
};

export const mapUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  createdAt: row.created_at,
});

export const mapHospital = (row: HospitalRow): HospitalRecord => ({
  id: row.id,
  name: row.name,
  location: row.location,
  lat: row.lat,
  lng: row.lng,
  type: row.type,
  status: row.status,
  rating: row.rating,
  icuBeds: { total: row.icu_total, available: row.icu_available },
  emergencyBeds: { total: row.er_total, available: row.er_available },
  generalBeds: { total: row.general_total, available: row.general_available },
  ventilators: { total: row.ventilator_total, available: row.ventilator_available },
  doctors: { total: row.doctors_total, available: row.doctors_available },
  specializations: JSON.parse(row.specializations_json) as string[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapAmbulance = (row: AmbulanceRow): AmbulanceRecord => ({
  id: row.id,
  vehicleNumber: row.vehicle_number,
  type: row.type,
  status: row.status,
  crew: row.crew_name,
  lat: row.lat,
  lng: row.lng,
  currentHospitalId: row.current_hospital_id ?? null,
  currentEmergencyId: row.current_emergency_id ?? null,
  lastSeenAt: row.last_seen_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapEmergency = (row: EmergencyRow): EmergencyRecord => ({
  id: row.id,
  patientName: row.patient_name,
  patientPhone: row.patient_phone ?? null,
  condition: row.condition,
  severity: row.severity,
  pickupAddress: row.pickup_address,
  pickupLatitude: row.pickup_latitude,
  pickupLongitude: row.pickup_longitude,
  status: row.status,
  queueReason: row.queue_reason ?? null,
  createdByUserId: row.created_by_user_id,
  assignedHospitalId: row.assigned_hospital_id ?? null,
  assignedAmbulanceId: row.assigned_ambulance_id ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at ?? null,
});

export const mapDispatch = (row: DispatchRow): DispatchRecord => ({
  id: row.id,
  emergencyId: row.emergency_id,
  ambulanceId: row.ambulance_id ?? null,
  hospitalId: row.hospital_id ?? null,
  score: row.score ?? null,
  distanceKm: row.distance_km ?? null,
  etaMinutes: row.eta_minutes ?? null,
  pickupEtaMinutes: row.pickup_eta_minutes ?? null,
  transportEtaMinutes: row.transport_eta_minutes ?? null,
  rankingSnapshot: normalizeDecisionSnapshot(row.ranking_snapshot_json),
  status: row.status,
  queueReason: row.queue_reason ?? null,
  pickupRoute: parseRoute(row.pickup_route_json),
  hospitalRoute: parseRoute(row.hospital_route_json),
  routePhase: row.route_phase ?? "idle",
  routeProgress: row.route_progress ?? 0,
  retryCount: row.retry_count ?? 0,
  lastRetryAt: row.last_retry_at ?? null,
  escalatedAt: row.escalated_at ?? null,
  dispatchedAt: row.dispatched_at ?? null,
  enRouteAt: row.en_route_at ?? null,
  arrivedAt: row.arrived_at ?? null,
  completedAt: row.completed_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapActivityLog = (row: ActivityLogRow): ActivityLogRecord => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id ?? null,
  eventType: row.event_type,
  message: row.message,
  metadata: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : null,
  createdAt: row.created_at,
});
