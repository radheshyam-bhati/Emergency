export type UserRole = "admin" | "dispatcher";
export type HospitalStatus = "operational" | "high-load" | "critical" | "offline";
export type AmbulanceStatus = "available" | "queued" | "assigned" | "en-route" | "at-hospital";
export type EmergencySeverity = "critical" | "serious" | "moderate" | "minor";
export type EmergencyStatus = "pending" | "queued" | "assigned" | "in-transit" | "arrived" | "completed" | "cancelled";
export type DispatchStatus = "queued" | "assigned" | "in-transit" | "arrived" | "completed" | "cancelled";
export type QueueReason = "NO_AMBULANCE" | "NO_CAPABLE_HOSPITAL" | null;
export type DispatchFallbackStrategy = "nearest-available" | "waitlist" | "manual-escalation";
export type DispatchRoutePhase = "idle" | "to-patient" | "to-hospital" | "completed";

export interface ResourceState {
  total: number;
  available: number;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Hospital {
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

export interface Ambulance {
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

export interface DispatchBreakdown {
  distance: number;
  icu: number;
  er: number;
  doctors: number;
  specialization: number;
  severityWeight: number;
}

export interface HospitalDecision {
  hospitalId: number;
  name: string;
  totalScore: number;
  distanceKm: number;
  etaMinutes: number;
  recommended: boolean;
  breakdown: DispatchBreakdown;
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
  status: "success" | "warning" | "pending";
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

export interface Dispatch {
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

export interface Emergency {
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
  assignedHospitalId: number | null;
  assignedAmbulanceId: number | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignedHospital: { id: number; name: string } | null;
  assignedAmbulance: { id: number; vehicleNumber: string } | null;
  dispatch: {
    id: number;
    status: DispatchStatus;
    etaMinutes: number | null;
    pickupEtaMinutes: number | null;
    transportEtaMinutes: number | null;
    distanceKm: number | null;
    score: number | null;
    queueReason: QueueReason;
    fallbackStrategy: DispatchFallbackStrategy;
    retryCount: number;
  } | null;
}

export interface ActivityLog {
  id: number;
  entityType: string;
  entityId: number | null;
  eventType: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface DispatchStep {
  step: string;
  status: string;
  detail: string;
  duration_ms?: number;
}

export interface DispatchDetailResponse {
  emergency: Emergency;
  dispatch: Dispatch | null;
  hospital: Hospital | null;
  ambulance: Ambulance | null;
  decision: RankingSnapshot;
  steps: DispatchStep[];
}

export interface DashboardMetrics {
  summary: {
    activeEmergencies: number;
    availableAmbulances: number;
    busyAmbulances: number;
    totalIcuAvailable: number;
    avgResponseMinutes: number;
  };
  insights: {
    efficiencyScore: number;
    overloadedHospitals: number;
    avgDispatchDelay: number;
    successRate: number;
  };
  responseTrend: Array<{
    label: string;
    avgResponseMinutes: number;
  }>;
  incidentHeatmap: Array<{
    label: string;
    count: number;
  }>;
  fleetStatus: Array<{
    name: string;
    value: number;
  }>;
  severityBreakdown: Array<{
    name: string;
    value: number;
  }>;
  hospitalCapacity: Array<{
    hospitalId: number;
    name: string;
    icu: number;
    emergency: number;
    general: number;
  }>;
}
