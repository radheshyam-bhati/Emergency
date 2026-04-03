import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivity } from "@/api/activity";
import { getAmbulances } from "@/api/ambulances";
import { previewDispatch } from "@/api/dispatch";
import { createEmergencyAndAssign, getEmergencies, type CreateEmergencyPayload } from "@/api/emergencies";
import { getHospitals } from "@/api/hospitals";
import { getMetrics } from "@/api/metrics";
import { formatRelativeTime } from "@/lib/time";
import type {
  ActivityLog,
  Ambulance,
  DashboardMetrics,
  DispatchDetailResponse,
  DispatchStep,
  Emergency,
  EmergencySeverity,
  Hospital,
  QueueReason,
  RankingSnapshot,
} from "@/types/domain";

export interface SimulationState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  emergencies: Emergency[];
  activity: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
  metrics: DashboardMetrics | null;
  realtimeConnected: boolean;
  loading: boolean;
}

export interface DispatchRequest {
  condition_type: string;
  severity: EmergencySeverity;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address?: string;
  patient_name?: string;
  patient_phone?: string;
}

interface Recommendation {
  hospital_id: number;
  hospital_name: string;
  score: number;
  distance_km: number;
  eta_minutes: number;
  icu_available: number;
  er_available: number;
  ventilators_available: number;
  reasons: string[];
  breakdown: {
    distance: number;
    icu: number;
    er: number;
    doctors: number;
    specialization: number;
    severityWeight: number;
  };
}

export interface DispatchResult {
  success: boolean;
  outcome: "assigned" | "queued";
  emergency_id: number;
  recommended_hospital: string;
  hospital_id: number | null;
  eta_minutes: number;
  distance_km: number;
  ai_score: number;
  queue_reason: QueueReason;
  fallback_strategy: RankingSnapshot["fallbackStrategy"];
  ambulance: {
    id: number;
    vehicle_number: string;
    type: string;
    crew: string;
    distance_km: number;
  } | null;
  all_recommendations: Recommendation[];
  decision: RankingSnapshot;
  steps: DispatchStep[];
  total_time_ms: number;
  detail: DispatchDetailResponse | null;
  error?: string;
}

interface SimulationContextType extends SimulationState {
  dispatchEmergency: (request: DispatchRequest) => Promise<DispatchResult>;
  previewDecision: (request: {
    condition: string;
    severity: EmergencySeverity;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
  }) => Promise<RankingSnapshot>;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  emergency: "emergency",
  dispatch: "dispatch",
  arrival: "arrival",
  "bed-reserved": "bed-reserved",
  completed: "completed",
  resolved: "resolved",
  queued: "queued",
  escalated: "queued",
  status: "status",
};

const buildRecommendations = (decision: RankingSnapshot, hospitals: Hospital[]): Recommendation[] => {
  const hospitalLookup = new Map(hospitals.map((hospital) => [hospital.id, hospital]));

  return decision.ranking.map((candidate) => {
    const hospital = hospitalLookup.get(candidate.hospitalId);

    return {
      hospital_id: candidate.hospitalId,
      hospital_name: candidate.name,
      score: candidate.totalScore,
      distance_km: candidate.distanceKm,
      eta_minutes: candidate.etaMinutes,
      icu_available: hospital?.icuBeds.available ?? 0,
      er_available: hospital?.emergencyBeds.available ?? 0,
      ventilators_available: hospital?.ventilators.available ?? 0,
      reasons:
        candidate.penalties.length > 0
          ? candidate.penalties
          : [
              `${hospital?.emergencyBeds.available ?? 0} emergency beds available`,
              `${hospital?.icuBeds.available ?? 0} ICU beds available`,
            ],
      breakdown: candidate.breakdown,
    };
  });
};

export function SimulationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hospitalsQuery = useQuery({
    queryKey: ["hospitals"],
    queryFn: getHospitals,
    refetchInterval: 10000,
  });
  const ambulancesQuery = useQuery({
    queryKey: ["ambulances"],
    queryFn: getAmbulances,
    refetchInterval: 5000,
  });
  const emergenciesQuery = useQuery({
    queryKey: ["emergencies"],
    queryFn: getEmergencies,
    refetchInterval: 5000,
  });
  const activityQuery = useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(20),
    refetchInterval: 5000,
  });
  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics,
    refetchInterval: 5000,
  });

  const hospitals = useMemo(() => hospitalsQuery.data ?? [], [hospitalsQuery.data]);
  const ambulances = useMemo(() => ambulancesQuery.data ?? [], [ambulancesQuery.data]);
  const emergencies = useMemo(() => emergenciesQuery.data ?? [], [emergenciesQuery.data]);
  const activity = useMemo(
    () =>
      (activityQuery.data ?? []).map((log: ActivityLog) => ({
        id: log.id,
        type: ACTIVITY_TYPE_MAP[log.eventType] ?? "dispatch",
        message: log.message,
        timestamp: formatRelativeTime(log.createdAt),
      })),
    [activityQuery.data],
  );
  const metrics = useMemo(() => metricsQuery.data ?? null, [metricsQuery.data]);

  const dispatchMutation = useMutation({
    mutationFn: async (request: DispatchRequest) => {
      const payload: CreateEmergencyPayload = {
        patientName: request.patient_name?.trim() || "Unknown Patient",
        patientPhone: request.patient_phone?.trim() || undefined,
        condition: request.condition_type,
        severity: request.severity,
        pickupAddress: request.pickup_address?.trim() || "Live incident location",
        pickupLatitude: request.pickup_latitude,
        pickupLongitude: request.pickup_longitude,
      };

      return createEmergencyAndAssign(payload);
    },
  });

  const previewDecision = useCallback(
    async (request: {
      condition: string;
      severity: EmergencySeverity;
      pickupAddress: string;
      pickupLatitude: number;
      pickupLongitude: number;
    }) => {
      const response = await previewDispatch(request);
      return response.decision;
    },
    [],
  );

  const dispatchEmergency = useCallback(
    async (request: DispatchRequest): Promise<DispatchResult> => {
      if (
        !request.condition_type ||
        !Number.isFinite(request.pickup_latitude) ||
        !Number.isFinite(request.pickup_longitude)
      ) {
        return {
          success: false,
          outcome: "queued",
          emergency_id: 0,
          recommended_hospital: "Unavailable",
          hospital_id: null,
          eta_minutes: 0,
          distance_km: 0,
          ai_score: 0,
          queue_reason: null,
          fallback_strategy: "waitlist",
          ambulance: null,
          all_recommendations: [],
          decision: {
            evaluatedAt: new Date().toISOString(),
            emergencySeverity: request.severity,
            chosenHospitalId: null,
            queueReason: null,
            score: null,
            factors: null,
            rejectedOptions: [],
            fallbackStrategy: "waitlist",
            ranking: [],
            replay: [],
          },
          steps: [],
          total_time_ms: 0,
          detail: null,
          error: "Condition and pickup coordinates are required.",
        };
      }

      const startedAt = performance.now();

      try {
        const detail = await dispatchMutation.mutateAsync(request);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["emergencies"] }),
          queryClient.invalidateQueries({ queryKey: ["hospitals"] }),
          queryClient.invalidateQueries({ queryKey: ["ambulances"] }),
          queryClient.invalidateQueries({ queryKey: ["activity"] }),
          queryClient.invalidateQueries({ queryKey: ["metrics"] }),
        ]);

        const recommendedHospital = detail.hospital?.name ?? "Awaiting allocation";
        const recommendations = buildRecommendations(detail.decision, hospitals);

        return {
          success: true,
          outcome: detail.dispatch?.queueReason ? "queued" : "assigned",
          emergency_id: detail.emergency.id,
          recommended_hospital: recommendedHospital,
          hospital_id: detail.hospital?.id ?? null,
          eta_minutes: detail.dispatch?.etaMinutes ?? 0,
          distance_km: detail.dispatch?.distanceKm ?? 0,
          ai_score: detail.decision.score ?? 0,
          queue_reason: detail.dispatch?.queueReason ?? detail.decision.queueReason,
          fallback_strategy: detail.decision.fallbackStrategy,
          ambulance: detail.ambulance
            ? {
                id: detail.ambulance.id,
                vehicle_number: detail.ambulance.vehicleNumber,
                type: detail.ambulance.type,
                crew: detail.ambulance.crew,
                distance_km: detail.dispatch?.distanceKm ?? 0,
              }
            : null,
          all_recommendations: recommendations,
          decision: detail.decision,
          steps: detail.steps,
          total_time_ms: Math.round(performance.now() - startedAt),
          detail,
        };
      } catch (error) {
        return {
          success: false,
          outcome: "queued",
          emergency_id: 0,
          recommended_hospital: "Unavailable",
          hospital_id: null,
          eta_minutes: 0,
          distance_km: 0,
          ai_score: 0,
          queue_reason: null,
          fallback_strategy: "waitlist",
          ambulance: null,
          all_recommendations: [],
          decision: {
            evaluatedAt: new Date().toISOString(),
            emergencySeverity: request.severity,
            chosenHospitalId: null,
            queueReason: null,
            score: null,
            factors: null,
            rejectedOptions: [],
            fallbackStrategy: "waitlist",
            ranking: [],
            replay: [],
          },
          steps: [],
          total_time_ms: Math.round(performance.now() - startedAt),
          detail: null,
          error: error instanceof Error ? error.message : "Failed to dispatch emergency",
        };
      }
    },
    [dispatchMutation, hospitals, queryClient],
  );

  const value = useMemo<SimulationContextType>(
    () => ({
      hospitals,
      ambulances,
      emergencies,
      activity,
      metrics,
      realtimeConnected:
        hospitalsQuery.isSuccess &&
        ambulancesQuery.isSuccess &&
        emergenciesQuery.isSuccess &&
        activityQuery.isSuccess &&
        metricsQuery.isSuccess,
      loading:
        hospitalsQuery.isLoading ||
        ambulancesQuery.isLoading ||
        emergenciesQuery.isLoading ||
        activityQuery.isLoading ||
        metricsQuery.isLoading,
      dispatchEmergency,
      previewDecision,
    }),
    [
      activity,
      activityQuery.isLoading,
      activityQuery.isSuccess,
      ambulances,
      ambulancesQuery.isLoading,
      ambulancesQuery.isSuccess,
      dispatchEmergency,
      emergencies,
      emergenciesQuery.isLoading,
      emergenciesQuery.isSuccess,
      hospitals,
      hospitalsQuery.isLoading,
      hospitalsQuery.isSuccess,
      metrics,
      metricsQuery.isLoading,
      metricsQuery.isSuccess,
      previewDecision,
    ],
  );

  return createElement(SimulationContext.Provider, { value }, children);
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }

  return context;
}
