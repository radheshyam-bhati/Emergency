import { ambulanceModel } from "../models/ambulance.model.js";
import { dispatchModel } from "../models/dispatch.model.js";
import { emergencyModel } from "../models/emergency.model.js";
import { hospitalModel } from "../models/hospital.model.js";

const minutesBetween = (from: string | null, to: string | null) => {
  if (!from || !to) {
    return null;
  }

  return (new Date(to).getTime() - new Date(from).getTime()) / 60000;
};

const formatBucketLabel = (value: Date) =>
  `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
};

export const metricsService = {
  getDashboardMetrics() {
    const hospitals = hospitalModel.list();
    const ambulances = ambulanceModel.list();
    const emergencies = emergencyModel.list();
    const dispatches = dispatchModel.list();
    const now = Date.now();

    const activeEmergencies = emergencies.filter(
      (emergency) => !["completed", "cancelled"].includes(emergency.status),
    );
    const availableAmbulances = ambulances.filter((ambulance) => ambulance.status === "available");
    const busyAmbulances = ambulances.filter((ambulance) => ambulance.status !== "available");
    const totalIcuAvailable = hospitals.reduce((sum, hospital) => sum + hospital.icuBeds.available, 0);
    const completedResponseTimes = dispatches
      .map((dispatch) => minutesBetween(dispatch.dispatchedAt, dispatch.arrivedAt))
      .filter((value): value is number => typeof value === "number" && value >= 0);
    const dispatchDelays = dispatches
      .map((dispatch) => {
        const emergency = emergencies.find((item) => item.id === dispatch.emergencyId);
        return emergency ? minutesBetween(emergency.createdAt, dispatch.dispatchedAt) : null;
      })
      .filter((value): value is number => typeof value === "number" && value >= 0);
    const completedDispatchCount = dispatches.filter((dispatch) => dispatch.status === "completed").length;
    const successRate =
      dispatches.length === 0 ? 0 : Number(((completedDispatchCount / dispatches.length) * 100).toFixed(1));
    const overloadedHospitals = hospitals.filter((hospital) =>
      ["high-load", "critical"].includes(hospital.status),
    ).length;
    const efficiencyScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            average(completedResponseTimes) * 4 -
            overloadedHospitals * 6 -
            activeEmergencies.filter((emergency) => emergency.status === "queued").length * 8,
        ),
      ),
    );

    const responseTrend = Array.from({ length: 8 }, (_, index) => {
      const bucketStart = new Date(now - (7 - index) * 3 * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 3 * 60 * 60 * 1000);
      const bucketValues = dispatches
        .filter((dispatch) => {
          if (!dispatch.arrivedAt || !dispatch.dispatchedAt) {
            return false;
          }

          const arrivedAt = new Date(dispatch.arrivedAt).getTime();
          return arrivedAt >= bucketStart.getTime() && arrivedAt < bucketEnd.getTime();
        })
        .map((dispatch) => minutesBetween(dispatch.dispatchedAt, dispatch.arrivedAt))
        .filter((value): value is number => typeof value === "number" && value >= 0);

      return {
        label: formatBucketLabel(bucketStart),
        avgResponseMinutes: average(bucketValues),
      };
    });

    const heatmapStart = now - 24 * 60 * 60 * 1000;
    const incidentHeatmap = Array.from({ length: 48 }, (_, index) => {
      const bucketStart = heatmapStart + index * 30 * 60 * 1000;
      const bucketEnd = bucketStart + 30 * 60 * 1000;
      const count = emergencies.filter((emergency) => {
        const createdAt = new Date(emergency.createdAt).getTime();
        return createdAt >= bucketStart && createdAt < bucketEnd;
      }).length;

      return {
        label: formatBucketLabel(new Date(bucketStart)),
        count,
      };
    });

    return {
      summary: {
        activeEmergencies: activeEmergencies.length,
        availableAmbulances: availableAmbulances.length,
        busyAmbulances: busyAmbulances.length,
        totalIcuAvailable,
        avgResponseMinutes: average(completedResponseTimes),
      },
      insights: {
        efficiencyScore,
        overloadedHospitals,
        avgDispatchDelay: average(dispatchDelays),
        successRate,
      },
      responseTrend,
      incidentHeatmap,
      fleetStatus: [
        { name: "Available", value: ambulances.filter((ambulance) => ambulance.status === "available").length },
        { name: "Assigned", value: ambulances.filter((ambulance) => ambulance.status === "assigned").length },
        { name: "En Route", value: ambulances.filter((ambulance) => ambulance.status === "en-route").length },
        { name: "At Hospital", value: ambulances.filter((ambulance) => ambulance.status === "at-hospital").length },
      ],
      severityBreakdown: [
        { name: "Critical", value: emergencies.filter((emergency) => emergency.severity === "critical").length },
        { name: "Serious", value: emergencies.filter((emergency) => emergency.severity === "serious").length },
        { name: "Moderate", value: emergencies.filter((emergency) => emergency.severity === "moderate").length },
        { name: "Minor", value: emergencies.filter((emergency) => emergency.severity === "minor").length },
      ],
      hospitalCapacity: hospitals.map((hospital) => ({
        hospitalId: hospital.id,
        name: hospital.name,
        icu: hospital.icuBeds.available,
        emergency: hospital.emergencyBeds.available,
        general: hospital.generalBeds.available,
      })),
    };
  },
};
