import { getDb } from "../db/client.js";
import { activityLogModel } from "../models/activity-log.model.js";
import { ambulanceModel } from "../models/ambulance.model.js";
import { dispatchModel } from "../models/dispatch.model.js";
import { emergencyModel } from "../models/emergency.model.js";
import { hospitalModel } from "../models/hospital.model.js";
import { createReplayStep, getQueueReasonMessage } from "../utils/decision.js";
import {
  type AmbulanceRecord,
  type DispatchFallbackStrategy,
  type DispatchRecord,
  type EmergencyRecord,
  type EmergencySeverity,
  type HospitalDecision,
  type HospitalRecord,
  type QueueReason,
  type RankingSnapshot,
  type RejectedOption,
} from "../utils/mappers.js";
import { getRoutePlan, calculateDistanceKm } from "../utils/routes.js";
import { nowIso } from "../utils/time.js";

const conditionSpecialtyMap: Record<string, string[]> = {
  "Cardiac Arrest": ["Cardiology", "Cardiac Surgery"],
  Stroke: ["Neurology", "Neurosurgery"],
  "Severe Head Trauma": ["Trauma", "Neurosurgery"],
  "Road Accident": ["Trauma", "Orthopedics", "General Surgery"],
  "Road Accident — Multiple Fractures": ["Trauma", "Orthopedics", "General Surgery"],
  "Fall Injury — Spinal": ["Trauma", "Orthopedics", "Neurosurgery"],
  "Respiratory Distress": ["Pulmonology"],
  "Burn Injury": ["Burns", "General Surgery"],
  "Severe Burns": ["Burns", "General Surgery"],
  "Chest Pain": ["Cardiology"],
  "Kidney Failure": ["Nephrology"],
  "Orthopedic Injury": ["Orthopedics"],
  "General Emergency": ["Trauma", "General Surgery"],
  "Head Trauma": ["Trauma", "Neurology", "Neurosurgery"],
  Burns: ["Burns", "General Surgery"],
};

const severityWeightMap: Record<EmergencySeverity, number> = {
  critical: 16,
  serious: 10,
  moderate: 6,
  minor: 2,
};

const queueThresholdBySeverity: Record<EmergencySeverity, number> = {
  critical: 3,
  serious: 6,
  moderate: 6,
  minor: 6,
};

interface AmbulanceCandidate {
  ambulance: AmbulanceRecord;
  pickupDistanceKm: number;
  pickupEtaMinutes: number;
}

interface ScoredHospital extends HospitalDecision {
  penaltyPoints: number;
  totalEtaMinutes: number;
  transportEtaMinutes: number;
  totalDistanceKm: number;
}

interface DecisionPlan {
  queueReason: QueueReason;
  fallbackStrategy: DispatchFallbackStrategy;
  ambulance: AmbulanceRecord | null;
  hospital: HospitalRecord | null;
  decision: RankingSnapshot;
  pickupRoute: [number, number][];
  hospitalRoute: [number, number][];
  pickupEtaMinutes: number | null;
  transportEtaMinutes: number | null;
  totalEtaMinutes: number | null;
  totalDistanceKm: number | null;
  score: number | null;
  retryCount: number;
  lastRetryAt: string | null;
  escalatedAt: string | null;
}

const createEmergencyLike = (input: {
  patientName: string;
  patientPhone?: string;
  condition: string;
  severity: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  createdByUserId: number;
}): EmergencyRecord => {
  const timestamp = nowIso();

  return {
    id: 0,
    patientName: input.patientName,
    patientPhone: input.patientPhone ?? null,
    condition: input.condition,
    severity: input.severity,
    pickupAddress: input.pickupAddress,
    pickupLatitude: input.pickupLatitude,
    pickupLongitude: input.pickupLongitude,
    status: "pending",
    queueReason: null,
    createdByUserId: input.createdByUserId,
    assignedHospitalId: null,
    assignedAmbulanceId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
};

const getSpecializationMatches = (condition: string, hospital: HospitalRecord) => {
  const expected = conditionSpecialtyMap[condition] ?? conditionSpecialtyMap["General Emergency"];
  return hospital.specializations.filter((specialization) => expected.includes(specialization));
};

const buildRejectedAmbulanceOptions = (emergency: EmergencyRecord, ambulances: AmbulanceRecord[]) =>
  ambulances.flatMap((ambulance): RejectedOption[] => {
    if (ambulance.status !== "available") {
      return [];
    }

    if (ambulance.type === "Patient Transport") {
      return [
        {
          id: ambulance.id,
          kind: "ambulance",
          name: ambulance.vehicleNumber,
          reason: "Patient transport units are not eligible for emergency dispatch",
        },
      ];
    }

    if (emergency.severity === "critical" && ambulance.type !== "ALS") {
      return [
        {
          id: ambulance.id,
          kind: "ambulance",
          name: ambulance.vehicleNumber,
          reason: "Not ALS for critical case",
        },
      ];
    }

    return [];
  });

const getEligibleAmbulances = (emergency: EmergencyRecord) => {
  const availableAmbulances = ambulanceModel.list().filter((ambulance) => ambulance.status === "available");
  const rejectedOptions = buildRejectedAmbulanceOptions(emergency, availableAmbulances);
  const rejectedIds = new Set(rejectedOptions.map((option) => option.id));

  const eligibleAmbulances = availableAmbulances
    .filter((ambulance) => !rejectedIds.has(ambulance.id))
    .map((ambulance) => {
      const pickupDistanceKm = calculateDistanceKm(
        emergency.pickupLatitude,
        emergency.pickupLongitude,
        ambulance.lat,
        ambulance.lng,
      );

      return {
        ambulance,
        pickupDistanceKm,
        pickupEtaMinutes: Math.max(3, Math.round(pickupDistanceKm * 2.4 + 2)),
      };
    })
    .sort((left, right) => left.pickupEtaMinutes - right.pickupEtaMinutes);

  return {
    eligibleAmbulances,
    rejectedOptions,
  };
};

const scoreHospital = (
  emergency: EmergencyRecord,
  hospital: HospitalRecord,
  pickupEtaMinutes: number,
  pickupDistanceKm: number,
): ScoredHospital => {
  const transportDistanceKm = calculateDistanceKm(
    emergency.pickupLatitude,
    emergency.pickupLongitude,
    hospital.lat,
    hospital.lng,
  );
  const transportEtaMinutes = Math.max(4, Math.round(transportDistanceKm * 2.3 + 4));
  const totalEtaMinutes = pickupEtaMinutes + transportEtaMinutes;
  const totalDistanceKm = Number((pickupDistanceKm + transportDistanceKm).toFixed(1));
  const specializationMatches = getSpecializationMatches(emergency.condition, hospital);
  const penalties: string[] = [];

  const distanceScore = Math.max(0, 36 - totalEtaMinutes * 1.8);
  const icuScore =
    emergency.severity === "critical"
      ? Math.min(28, hospital.icuBeds.available * 3.5)
      : Math.min(16, hospital.icuBeds.available * 1.4);
  const erScore = Math.min(22, hospital.emergencyBeds.available * 1.6);
  const doctorScore = Math.min(18, hospital.doctors.available * 0.75);
  const specializationScore = specializationMatches.length > 0 ? 20 + specializationMatches.length * 4 : 6;
  const severityWeight = severityWeightMap[emergency.severity];

  let penaltyPoints = 0;

  if (hospital.status === "high-load") {
    penaltyPoints += 8;
    penalties.push("Hospital under high load");
  }

  if (hospital.status === "critical") {
    penaltyPoints += 16;
    penalties.push("Hospital under critical load");
  }

  if (hospital.status === "offline") {
    penaltyPoints += 100;
    penalties.push("Hospital offline");
  }

  if (hospital.emergencyBeds.available === 0) {
    penaltyPoints += 18;
    penalties.push("No ER beds available");
  }

  if (emergency.severity === "critical" && hospital.icuBeds.available === 0) {
    penaltyPoints += 24;
    penalties.push("No ICU beds");
  }

  if (hospital.doctors.available === 0) {
    penaltyPoints += 12;
    penalties.push("No doctors on active duty");
  }

  if (specializationMatches.length === 0 && emergency.severity !== "minor") {
    penaltyPoints += 10;
    penalties.push("No direct specialization match");
  }

  const totalScore = Number(
    Math.max(
      0,
      distanceScore + icuScore + erScore + doctorScore + specializationScore + severityWeight - penaltyPoints,
    ).toFixed(1),
  );

  return {
    hospitalId: hospital.id,
    name: hospital.name,
    totalScore,
    distanceKm: totalDistanceKm,
    etaMinutes: totalEtaMinutes,
    recommended: false,
    breakdown: {
      distance: Number(distanceScore.toFixed(1)),
      icu: Number(icuScore.toFixed(1)),
      er: Number(erScore.toFixed(1)),
      doctors: Number(doctorScore.toFixed(1)),
      specialization: Number(specializationScore.toFixed(1)),
      severityWeight,
    },
    penalties,
    penaltyPoints,
    totalEtaMinutes,
    transportEtaMinutes,
    totalDistanceKm,
  };
};

const buildRankingSnapshot = (
  emergency: EmergencyRecord,
  pickupEtaMinutes: number,
  pickupDistanceKm: number,
) => {
  const rankedHospitals = hospitalModel
    .list()
    .map((hospital) => scoreHospital(emergency, hospital, pickupEtaMinutes, pickupDistanceKm))
    .sort((left, right) => right.totalScore - left.totalScore);

  const recommendedHospital =
    rankedHospitals.find(
      (hospital) =>
        hospital.totalScore >= 24 &&
        !hospital.penalties.includes("Hospital offline") &&
        !hospital.penalties.includes("No ER beds available") &&
        !(emergency.severity === "critical" && hospital.penalties.includes("No ICU beds")),
    ) ?? null;

  if (recommendedHospital) {
    recommendedHospital.recommended = true;
  }

  return { rankedHospitals, recommendedHospital };
};

const buildRejectedHospitalOptions = (
  rankedHospitals: ScoredHospital[],
  selectedHospital: ScoredHospital | null,
) =>
  rankedHospitals
    .filter((hospital) => hospital.hospitalId !== selectedHospital?.hospitalId)
    .map((hospital): RejectedOption => ({
      id: hospital.hospitalId,
      kind: "hospital",
      name: hospital.name,
      reason:
        hospital.penalties[0] ??
        (selectedHospital ? `Lower overall score than ${selectedHospital.name}` : "Did not clear the capability threshold"),
    }));

const buildDecisionSnapshot = (input: {
  emergency: EmergencyRecord;
  rankedHospitals: ScoredHospital[];
  selectedHospital: ScoredHospital | null;
  queueReason: QueueReason;
  fallbackStrategy: DispatchFallbackStrategy;
  rejectedOptions: RejectedOption[];
  pickupEtaMinutes: number | null;
  transportEtaMinutes: number | null;
  previousSnapshot?: RankingSnapshot | null;
  replay: RankingSnapshot["replay"];
}): RankingSnapshot => {
  const selectedHospital = input.selectedHospital;

  return {
    evaluatedAt: nowIso(),
    emergencySeverity: input.emergency.severity,
    chosenHospitalId: selectedHospital?.hospitalId ?? null,
    queueReason: input.queueReason,
    score: selectedHospital?.totalScore ?? null,
    factors: selectedHospital
      ? {
          distanceScore: selectedHospital.breakdown.distance,
          pickupEtaMinutes: input.pickupEtaMinutes ?? 0,
          transportEtaMinutes: input.transportEtaMinutes ?? 0,
          totalEtaMinutes: selectedHospital.totalEtaMinutes,
          icuScore: selectedHospital.breakdown.icu,
          erScore: selectedHospital.breakdown.er,
          doctorScore: selectedHospital.breakdown.doctors,
          specializationScore: selectedHospital.breakdown.specialization,
          severityBoost: selectedHospital.breakdown.severityWeight,
          penalties: selectedHospital.penaltyPoints,
        }
      : null,
    rejectedOptions: input.rejectedOptions,
    fallbackStrategy: input.fallbackStrategy,
    ranking: input.rankedHospitals.map((hospital) => ({
      hospitalId: hospital.hospitalId,
      name: hospital.name,
      totalScore: hospital.totalScore,
      distanceKm: hospital.distanceKm,
      etaMinutes: hospital.etaMinutes,
      recommended: hospital.recommended,
      breakdown: hospital.breakdown,
      penalties: hospital.penalties,
    })),
    replay: [...(input.previousSnapshot?.replay ?? []), ...input.replay],
  };
};

const buildReplay = (input: {
  emergency: EmergencyRecord;
  evaluatedAt: string;
  eligibleAmbulanceCount: number;
  rankedHospitalCount: number;
  queueReason: QueueReason;
  fallbackStrategy: DispatchFallbackStrategy;
  rejectedOptions: RejectedOption[];
  selectedHospital: ScoredHospital | null;
  isRetry: boolean;
}): RankingSnapshot["replay"] => {
  const replay: RankingSnapshot["replay"] = [];

  if (!input.isRetry) {
    replay.push(
      createReplayStep(
        "emergency_created",
        "Emergency created",
        `${input.emergency.patientName} registered as a ${input.emergency.severity} ${input.emergency.condition.toLowerCase()} case.`,
        "success",
        input.emergency.createdAt,
      ),
    );
  } else {
    replay.push(
      createReplayStep(
        "dispatch_recheck",
        "Dispatch recheck",
        `SEAE re-ran the allocation attempt for ${input.emergency.patientName}.`,
        "pending",
        input.evaluatedAt,
      ),
    );
  }

  replay.push(
    createReplayStep(
      "ambulances_screened",
      "Ambulances screened",
      `${input.eligibleAmbulanceCount} eligible ambulance${input.eligibleAmbulanceCount === 1 ? "" : "s"} remained after policy checks.`,
      input.eligibleAmbulanceCount > 0 ? "success" : "warning",
      input.evaluatedAt,
    ),
  );

  replay.push(
    createReplayStep(
      "hospitals_ranked",
      "Hospitals ranked",
      `${input.rankedHospitalCount} hospitals were evaluated by SEAE for distance, capacity, and specialty fit.`,
      input.rankedHospitalCount > 0 ? "success" : "warning",
      input.evaluatedAt,
    ),
  );

  replay.push(
    createReplayStep(
      "rejections_recorded",
      "Rejections recorded",
      input.rejectedOptions.length > 0
        ? `${input.rejectedOptions.length} alternatives were rejected and documented for operator review.`
        : "No hard rejections were recorded during this pass.",
      input.rejectedOptions.length > 0 ? "warning" : "success",
      input.evaluatedAt,
    ),
  );

  if (input.selectedHospital) {
    replay.push(
      createReplayStep(
        "resources_reserved",
        "Resources reserved",
        `${input.selectedHospital.name} accepted the case and reserved capacity for arrival.`,
        "success",
        input.evaluatedAt,
      ),
    );
    replay.push(
      createReplayStep(
        "dispatch_selected",
        "Dispatch selected",
        `${input.selectedHospital.name} was chosen with a score of ${input.selectedHospital.totalScore}.`,
        "success",
        input.evaluatedAt,
      ),
    );
  } else {
    replay.push(
      createReplayStep(
        input.fallbackStrategy === "manual-escalation" ? "manual_escalation" : "waitlist_strategy",
        input.fallbackStrategy === "manual-escalation" ? "Manual escalation" : "Waitlist strategy",
        getQueueReasonMessage(input.queueReason),
        "warning",
        input.evaluatedAt,
      ),
    );
  }

  return replay;
};

const buildDecisionPlan = async (
  emergency: EmergencyRecord,
  options?: {
    existingDispatch?: DispatchRecord | null;
    isRetry?: boolean;
  },
): Promise<DecisionPlan> => {
  const existingDispatch = options?.existingDispatch ?? null;
  const evaluatedAt = nowIso();
  const { eligibleAmbulances, rejectedOptions: rejectedAmbulances } = getEligibleAmbulances(emergency);
  const selectedAmbulance = eligibleAmbulances[0] ?? null;
  const { rankedHospitals, recommendedHospital } = selectedAmbulance
    ? buildRankingSnapshot(
        emergency,
        selectedAmbulance.pickupEtaMinutes,
        selectedAmbulance.pickupDistanceKm,
      )
    : {
        rankedHospitals: hospitalModel.list().map((hospital) =>
          scoreHospital(emergency, hospital, 0, 0),
        ),
        recommendedHospital: null,
      };
  const queueReason: QueueReason = !selectedAmbulance
    ? "NO_AMBULANCE"
    : !recommendedHospital
      ? "NO_CAPABLE_HOSPITAL"
      : null;

  const nextRetryCount =
    queueReason && options?.isRetry ? (existingDispatch?.retryCount ?? 0) + 1 : existingDispatch?.retryCount ?? 0;
  const escalationThreshold = queueThresholdBySeverity[emergency.severity];
  const fallbackStrategy: DispatchFallbackStrategy =
    queueReason && nextRetryCount >= escalationThreshold
      ? "manual-escalation"
      : queueReason
        ? "waitlist"
        : "nearest-available";
  const rejectedHospitals = buildRejectedHospitalOptions(rankedHospitals, recommendedHospital);
  const replay = buildReplay({
    emergency,
    evaluatedAt,
    eligibleAmbulanceCount: eligibleAmbulances.length,
    rankedHospitalCount: rankedHospitals.length,
    queueReason,
    fallbackStrategy,
    rejectedOptions: [...rejectedAmbulances, ...rejectedHospitals],
    selectedHospital: recommendedHospital,
    isRetry: Boolean(options?.isRetry),
  });

  const decision = buildDecisionSnapshot({
    emergency,
    rankedHospitals,
    selectedHospital: recommendedHospital,
    queueReason,
    fallbackStrategy,
    rejectedOptions: [...rejectedAmbulances, ...rejectedHospitals],
    pickupEtaMinutes: selectedAmbulance?.pickupEtaMinutes ?? null,
    transportEtaMinutes: recommendedHospital?.transportEtaMinutes ?? null,
    previousSnapshot: existingDispatch?.rankingSnapshot ?? null,
    replay,
  });

  if (!queueReason || !selectedAmbulance || !recommendedHospital) {
    return {
      queueReason,
      fallbackStrategy,
      ambulance: selectedAmbulance?.ambulance ?? null,
      hospital: recommendedHospital ? hospitalModel.getById(recommendedHospital.hospitalId) : null,
      decision,
      pickupRoute: [],
      hospitalRoute: [],
      pickupEtaMinutes: selectedAmbulance?.pickupEtaMinutes ?? null,
      transportEtaMinutes: recommendedHospital?.transportEtaMinutes ?? null,
      totalEtaMinutes: recommendedHospital?.totalEtaMinutes ?? null,
      totalDistanceKm: recommendedHospital?.totalDistanceKm ?? null,
      score: recommendedHospital?.totalScore ?? null,
      retryCount: nextRetryCount,
      lastRetryAt: options?.isRetry ? evaluatedAt : existingDispatch?.lastRetryAt ?? null,
      escalatedAt:
        fallbackStrategy === "manual-escalation"
          ? existingDispatch?.escalatedAt ?? evaluatedAt
          : null,
    };
  }

  const [pickupRoute, hospitalRoute] = await Promise.all([
    getRoutePlan(
      { lat: selectedAmbulance.ambulance.lat, lng: selectedAmbulance.ambulance.lng },
      { lat: emergency.pickupLatitude, lng: emergency.pickupLongitude },
    ),
    getRoutePlan(
      { lat: emergency.pickupLatitude, lng: emergency.pickupLongitude },
      { lat: recommendedHospital ? hospitalModel.getById(recommendedHospital.hospitalId)!.lat : emergency.pickupLatitude, lng: recommendedHospital ? hospitalModel.getById(recommendedHospital.hospitalId)!.lng : emergency.pickupLongitude },
    ),
  ]);

  const selectedHospitalRecord = hospitalModel.getById(recommendedHospital.hospitalId);

  return {
    queueReason: null,
    fallbackStrategy,
    ambulance: selectedAmbulance.ambulance,
    hospital: selectedHospitalRecord,
    decision,
    pickupRoute: pickupRoute.geometry,
    hospitalRoute: hospitalRoute.geometry,
    pickupEtaMinutes: pickupRoute.etaMinutes,
    transportEtaMinutes: hospitalRoute.etaMinutes,
    totalEtaMinutes: pickupRoute.etaMinutes + hospitalRoute.etaMinutes,
    totalDistanceKm: Number((pickupRoute.distanceKm + hospitalRoute.distanceKm).toFixed(1)),
    score: recommendedHospital.totalScore,
    retryCount: existingDispatch?.retryCount ?? 0,
    lastRetryAt: existingDispatch?.lastRetryAt ?? null,
    escalatedAt: null,
  };
};

const persistDecision = (
  emergency: EmergencyRecord,
  decisionPlan: DecisionPlan,
  existingDispatch: DispatchRecord | null,
) => {
  if (decisionPlan.queueReason) {
    emergencyModel.markQueued(emergency.id, decisionPlan.queueReason);

    const queuedInput = {
      emergencyId: emergency.id,
      ambulanceId: null,
      hospitalId: null,
      score: null,
      distanceKm: null,
      etaMinutes: null,
      pickupEtaMinutes: decisionPlan.pickupEtaMinutes,
      transportEtaMinutes: decisionPlan.transportEtaMinutes,
      rankingSnapshot: decisionPlan.decision,
      status: "queued" as const,
      queueReason: decisionPlan.queueReason,
      pickupRoute: [],
      hospitalRoute: [],
      routePhase: "idle" as const,
      routeProgress: 0,
      retryCount: decisionPlan.retryCount,
      lastRetryAt: decisionPlan.lastRetryAt,
      escalatedAt: decisionPlan.escalatedAt,
    };

    if (existingDispatch) {
      dispatchModel.updateDecision(queuedInput);
    } else {
      dispatchModel.create(queuedInput);
    }

    activityLogModel.add(
      "dispatch",
      emergency.id,
      decisionPlan.fallbackStrategy === "manual-escalation" ? "escalated" : "queued",
      decisionPlan.fallbackStrategy === "manual-escalation"
        ? `Dispatch requires manual escalation after ${decisionPlan.retryCount} unsuccessful retries.`
        : getQueueReasonMessage(decisionPlan.queueReason),
      {
        queueReason: decisionPlan.queueReason,
        retryCount: decisionPlan.retryCount,
        fallbackStrategy: decisionPlan.fallbackStrategy,
      },
    );

    return {
      ...decisionPlan,
      emergency: emergencyModel.getById(emergency.id)!,
      dispatch: dispatchModel.getByEmergencyId(emergency.id)!,
    };
  }

  emergencyModel.markAssigned(emergency.id, decisionPlan.ambulance!.id, decisionPlan.hospital!.id);
  ambulanceModel.assignToEmergency(decisionPlan.ambulance!.id, emergency.id, "assigned");
  ambulanceModel.updateLocation(
    decisionPlan.ambulance!.id,
    decisionPlan.ambulance!.lat,
    decisionPlan.ambulance!.lng,
  );
  hospitalModel.reserveResources(decisionPlan.hospital!.id, emergency.severity);

  const assignedInput = {
    emergencyId: emergency.id,
    ambulanceId: decisionPlan.ambulance!.id,
    hospitalId: decisionPlan.hospital!.id,
    score: decisionPlan.score,
    distanceKm: decisionPlan.totalDistanceKm,
    etaMinutes: decisionPlan.totalEtaMinutes,
    pickupEtaMinutes: decisionPlan.pickupEtaMinutes,
    transportEtaMinutes: decisionPlan.transportEtaMinutes,
    rankingSnapshot: decisionPlan.decision,
    status: "assigned" as const,
    queueReason: null,
    pickupRoute: decisionPlan.pickupRoute,
    hospitalRoute: decisionPlan.hospitalRoute,
    routePhase: "to-patient" as const,
    routeProgress: 0,
    retryCount: decisionPlan.retryCount,
    lastRetryAt: decisionPlan.lastRetryAt,
    escalatedAt: decisionPlan.escalatedAt,
  };

  if (existingDispatch) {
    dispatchModel.updateDecision(assignedInput);
  } else {
    dispatchModel.create(assignedInput);
  }

  activityLogModel.add(
    "dispatch",
    emergency.id,
    "dispatch",
    `Ambulance ${decisionPlan.ambulance!.vehicleNumber} assigned to ${emergency.patientName}`,
    { ambulanceId: decisionPlan.ambulance!.id, fallbackStrategy: decisionPlan.fallbackStrategy },
  );
  activityLogModel.add(
    "dispatch",
    emergency.id,
    "bed-reserved",
    `${decisionPlan.hospital!.name} reserved capacity for ${emergency.patientName}`,
    { hospitalId: decisionPlan.hospital!.id, totalScore: decisionPlan.score },
  );

  return {
    ...decisionPlan,
    emergency: emergencyModel.getById(emergency.id)!,
    dispatch: dispatchModel.getByEmergencyId(emergency.id)!,
  };
};

export const seaeService = {
  preview(input: {
    condition: string;
    severity: EmergencySeverity;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
  }) {
    const emergencyLike = createEmergencyLike({
      ...input,
      patientName: "Preview Case",
      createdByUserId: 0,
    });
    const { eligibleAmbulances } = getEligibleAmbulances(emergencyLike);
    const selectedAmbulance = eligibleAmbulances[0] ?? null;
    const { rankedHospitals, recommendedHospital } = selectedAmbulance
      ? buildRankingSnapshot(
          emergencyLike,
          selectedAmbulance.pickupEtaMinutes,
          selectedAmbulance.pickupDistanceKm,
        )
      : { rankedHospitals: [], recommendedHospital: null };

    return buildDecisionSnapshot({
      emergency: emergencyLike,
      rankedHospitals,
      selectedHospital: recommendedHospital,
      queueReason: !selectedAmbulance ? "NO_AMBULANCE" : !recommendedHospital ? "NO_CAPABLE_HOSPITAL" : null,
      fallbackStrategy: !selectedAmbulance || !recommendedHospital ? "waitlist" : "nearest-available",
      rejectedOptions: [
        ...buildRejectedAmbulanceOptions(emergencyLike, ambulanceModel.list()),
        ...buildRejectedHospitalOptions(rankedHospitals, recommendedHospital),
      ],
      pickupEtaMinutes: selectedAmbulance?.pickupEtaMinutes ?? null,
      transportEtaMinutes: recommendedHospital?.transportEtaMinutes ?? null,
      replay: [],
    });
  },

  async createAndAssignEmergency(input: {
    patientName: string;
    patientPhone?: string;
    condition: string;
    severity: EmergencySeverity;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    createdByUserId: number;
  }) {
    const emergencyLike = createEmergencyLike(input);
    const decisionPlan = await buildDecisionPlan(emergencyLike);

    const saveEmergency = getDb().transaction(() => {
      const emergency = emergencyModel.create(input);

      activityLogModel.add(
        "emergency",
        emergency.id,
        "emergency",
        `Emergency intake received for ${emergency.patientName} at ${emergency.pickupAddress}`,
        { severity: emergency.severity, condition: emergency.condition },
      );

      return persistDecision(emergency, decisionPlan, null);
    });

    return saveEmergency();
  },

  async assignEmergency(
    emergencyId: number,
    options?: {
      isRetry?: boolean;
    },
  ) {
    const emergency = emergencyModel.getById(emergencyId);

    if (!emergency) {
      throw new Error("Emergency not found");
    }

    const existingDispatch = dispatchModel.getByEmergencyId(emergencyId);

    if (existingDispatch && existingDispatch.status !== "queued") {
      return {
        emergency,
        dispatch: existingDispatch,
        queueReason: existingDispatch.queueReason,
        fallbackStrategy: existingDispatch.rankingSnapshot.fallbackStrategy,
        hospital: existingDispatch.hospitalId ? hospitalModel.getById(existingDispatch.hospitalId) : null,
        ambulance: existingDispatch.ambulanceId ? ambulanceModel.getById(existingDispatch.ambulanceId) : null,
        decision: existingDispatch.rankingSnapshot,
      };
    }

    const decisionPlan = await buildDecisionPlan(emergency, {
      existingDispatch,
      isRetry: options?.isRetry,
    });

    const saveDecision = getDb().transaction(() => persistDecision(emergency, decisionPlan, existingDispatch));
    return saveDecision();
  },
};
