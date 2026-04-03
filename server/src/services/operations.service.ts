import { activityLogModel } from "../models/activity-log.model.js";
import { ambulanceModel } from "../models/ambulance.model.js";
import { dispatchModel } from "../models/dispatch.model.js";
import { emergencyModel } from "../models/emergency.model.js";
import { hospitalModel } from "../models/hospital.model.js";
import { appendReplayStep, createReplayStep } from "../utils/decision.js";
import type { RankingSnapshot } from "../utils/mappers.js";
import { getPositionAlongRoute, getProgressIncrement } from "../utils/routes.js";
import { nowIso } from "../utils/time.js";
import { seaeService } from "./seae.service.js";

const RETRY_INTERVAL_SECONDS = 5;
const COMPLETION_HOLD_SECONDS = 5;

let lifecycleLoop: NodeJS.Timeout | null = null;

const secondsSince = (value: string | null) =>
  value ? (Date.now() - new Date(value).getTime()) / 1000 : Number.POSITIVE_INFINITY;

const computeHospitalStatus = (hospital: ReturnType<typeof hospitalModel.list>[number]) => {
  const emergencyRatio = hospital.emergencyBeds.available / hospital.emergencyBeds.total;
  const icuRatio = hospital.icuBeds.available / hospital.icuBeds.total;
  const doctorRatio = hospital.doctors.available / hospital.doctors.total;
  const combinedRatio = (emergencyRatio + icuRatio + doctorRatio) / 3;

  if (combinedRatio < 0.1) {
    return "critical" as const;
  }

  if (combinedRatio < 0.28) {
    return "high-load" as const;
  }

  return "operational" as const;
};

const pushReplayStep = (
  emergencyId: number,
  snapshot: RankingSnapshot,
  code: string,
  title: string,
  detail: string,
  status: "success" | "warning" | "pending",
) => {
  dispatchModel.updateRankingSnapshot(
    emergencyId,
    appendReplayStep(snapshot, createReplayStep(code, title, detail, status, nowIso())),
  );
};

const moveDispatchToPatient = (dispatch: ReturnType<typeof dispatchModel.listActive>[number]) => {
  if (!dispatch.ambulanceId) {
    return;
  }

  const nextProgress = Math.min(1, dispatch.routeProgress + getProgressIncrement(dispatch.pickupEtaMinutes));
  const nextPosition = getPositionAlongRoute(dispatch.pickupRoute, nextProgress);

  if (nextPosition) {
    ambulanceModel.updateLocation(dispatch.ambulanceId, nextPosition.lat, nextPosition.lng);
  }

  const remainingEtaMinutes = Math.max(
    1,
    Math.round((1 - nextProgress) * (dispatch.pickupEtaMinutes ?? 0) + (dispatch.transportEtaMinutes ?? 0)),
  );

  if (nextProgress >= 1) {
    dispatchModel.updateTracking(dispatch.emergencyId, {
      routePhase: "to-hospital",
      routeProgress: 0,
      etaMinutes: dispatch.transportEtaMinutes,
      pickupEtaMinutes: dispatch.pickupEtaMinutes,
      transportEtaMinutes: dispatch.transportEtaMinutes,
    });
    dispatchModel.updateStatus(dispatch.emergencyId, "in-transit");
    emergencyModel.updateStatus(dispatch.emergencyId, "in-transit");
    ambulanceModel.updateStatus(dispatch.ambulanceId, "en-route");

    pushReplayStep(
      dispatch.emergencyId,
      dispatch.rankingSnapshot,
      "lifecycle_to_hospital",
      "Patient loaded",
      "The ambulance reached the patient and is now en route to the destination hospital.",
      "success",
    );
    activityLogModel.add(
      "dispatch",
      dispatch.emergencyId,
      "dispatch",
      `Dispatch ${dispatch.id} is now transporting the patient to the hospital`,
    );
    return;
  }

  dispatchModel.updateTracking(dispatch.emergencyId, {
    routePhase: "to-patient",
    routeProgress: nextProgress,
    etaMinutes: remainingEtaMinutes,
    pickupEtaMinutes: dispatch.pickupEtaMinutes,
    transportEtaMinutes: dispatch.transportEtaMinutes,
  });
};

const moveDispatchToHospital = (dispatch: ReturnType<typeof dispatchModel.listActive>[number]) => {
  if (!dispatch.ambulanceId) {
    return;
  }

  const nextProgress = Math.min(1, dispatch.routeProgress + getProgressIncrement(dispatch.transportEtaMinutes));
  const nextPosition = getPositionAlongRoute(dispatch.hospitalRoute, nextProgress);

  if (nextPosition) {
    ambulanceModel.updateLocation(dispatch.ambulanceId, nextPosition.lat, nextPosition.lng);
  }

  const remainingEtaMinutes = Math.max(1, Math.round((1 - nextProgress) * (dispatch.transportEtaMinutes ?? 0)));

  if (nextProgress >= 1) {
    dispatchModel.updateTracking(dispatch.emergencyId, {
      routePhase: "completed",
      routeProgress: 1,
      etaMinutes: 0,
      pickupEtaMinutes: dispatch.pickupEtaMinutes,
      transportEtaMinutes: dispatch.transportEtaMinutes,
    });
    dispatchModel.updateStatus(dispatch.emergencyId, "arrived");
    emergencyModel.updateStatus(dispatch.emergencyId, "arrived");
    ambulanceModel.updateStatus(dispatch.ambulanceId, "at-hospital");

    pushReplayStep(
      dispatch.emergencyId,
      dispatch.rankingSnapshot,
      "lifecycle_arrived",
      "Hospital arrival",
      "The ambulance arrived at the destination hospital and handoff is in progress.",
      "success",
    );
    activityLogModel.add(
      "dispatch",
      dispatch.emergencyId,
      "arrival",
      `Patient for dispatch ${dispatch.id} arrived at the destination hospital`,
    );
    return;
  }

  dispatchModel.updateTracking(dispatch.emergencyId, {
    routePhase: "to-hospital",
    routeProgress: nextProgress,
    etaMinutes: remainingEtaMinutes,
    pickupEtaMinutes: dispatch.pickupEtaMinutes,
    transportEtaMinutes: dispatch.transportEtaMinutes,
  });
};

const completeDispatch = (dispatch: ReturnType<typeof dispatchModel.listActive>[number]) => {
  const emergency = emergencyModel.getById(dispatch.emergencyId);

  if (!emergency) {
    return;
  }

  dispatchModel.updateStatus(dispatch.emergencyId, "completed");
  emergencyModel.updateStatus(dispatch.emergencyId, "completed");

  if (dispatch.ambulanceId) {
    ambulanceModel.releaseFromEmergency(dispatch.ambulanceId, dispatch.hospitalId);
  }

  if (dispatch.hospitalId) {
    hospitalModel.releaseResources(dispatch.hospitalId, emergency.severity);
  }

  pushReplayStep(
    dispatch.emergencyId,
    dispatch.rankingSnapshot,
    "lifecycle_completed",
    "Resources released",
    "The dispatch completed successfully and hospital capacity was returned to service.",
    "success",
  );
  activityLogModel.add(
    "dispatch",
    dispatch.emergencyId,
    "completed",
    `Dispatch ${dispatch.id} completed and ambulance returned to service`,
  );
};

export const operationsService = {
  async runOperationalTick() {
    const activeDispatches = dispatchModel.listActive();

    for (const dispatch of activeDispatches) {
      if (dispatch.status === "queued" && !dispatch.escalatedAt) {
        const retryAnchor = dispatch.lastRetryAt ?? dispatch.updatedAt ?? dispatch.createdAt;

        if (secondsSince(retryAnchor) >= RETRY_INTERVAL_SECONDS) {
          try {
            await seaeService.assignEmergency(dispatch.emergencyId, { isRetry: true });
          } catch {
            // Keep the queued case visible for the next retry cycle.
          }
        }

        continue;
      }

      if (dispatch.status === "assigned" && dispatch.routePhase === "to-patient") {
        moveDispatchToPatient(dispatch);
        continue;
      }

      if (dispatch.status === "in-transit" && dispatch.routePhase === "to-hospital") {
        moveDispatchToHospital(dispatch);
        continue;
      }

      if (dispatch.status === "arrived" && secondsSince(dispatch.arrivedAt) >= COMPLETION_HOLD_SECONDS) {
        completeDispatch(dispatch);
      }
    }

    hospitalModel.list().forEach((hospital) => {
      const nextStatus = computeHospitalStatus(hospital);
      if (hospital.status !== "offline" && hospital.status !== nextStatus) {
        hospitalModel.updateStatus(hospital.id, nextStatus);
      }
    });
  },

  startLifecycleLoop() {
    if (lifecycleLoop) {
      return;
    }

    void this.runOperationalTick();
    lifecycleLoop = setInterval(() => {
      void this.runOperationalTick();
    }, RETRY_INTERVAL_SECONDS * 1000);
  },

  stopLifecycleLoop() {
    if (lifecycleLoop) {
      clearInterval(lifecycleLoop);
      lifecycleLoop = null;
    }
  },
};
