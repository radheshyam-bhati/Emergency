import { activityLogModel } from "../models/activity-log.model.js";
import { ambulanceModel } from "../models/ambulance.model.js";
import { dispatchModel } from "../models/dispatch.model.js";
import { emergencyModel } from "../models/emergency.model.js";
import { hospitalModel } from "../models/hospital.model.js";

export const readModelService = {
  listHospitals() {
    return hospitalModel.list();
  },

  getHospitalById(id: number) {
    return hospitalModel.getById(id);
  },

  listAmbulances() {
    return ambulanceModel.list();
  },

  listEmergencies() {
    const hospitals = new Map(hospitalModel.list().map((hospital) => [hospital.id, hospital]));
    const ambulances = new Map(ambulanceModel.list().map((ambulance) => [ambulance.id, ambulance]));

    return emergencyModel.list().map((emergency) => {
      const dispatch = dispatchModel.getByEmergencyId(emergency.id);
      const assignedHospital = emergency.assignedHospitalId ? hospitals.get(emergency.assignedHospitalId) : null;
      const assignedAmbulance = emergency.assignedAmbulanceId
        ? ambulances.get(emergency.assignedAmbulanceId)
        : null;

      return {
        ...emergency,
        assignedHospital: assignedHospital
          ? {
              id: assignedHospital.id,
              name: assignedHospital.name,
            }
          : null,
        assignedAmbulance: assignedAmbulance
          ? {
              id: assignedAmbulance.id,
              vehicleNumber: assignedAmbulance.vehicleNumber,
            }
          : null,
        dispatch: dispatch
          ? {
              id: dispatch.id,
              status: dispatch.status,
              etaMinutes: dispatch.etaMinutes,
              pickupEtaMinutes: dispatch.pickupEtaMinutes,
              transportEtaMinutes: dispatch.transportEtaMinutes,
              distanceKm: dispatch.distanceKm,
              score: dispatch.score,
              queueReason: dispatch.queueReason,
              fallbackStrategy: dispatch.rankingSnapshot.fallbackStrategy,
              retryCount: dispatch.retryCount,
            }
          : null,
      };
    });
  },

  getDispatch(emergencyId: number) {
    const dispatch = dispatchModel.getByEmergencyId(emergencyId);

    if (!dispatch) {
      return null;
    }

    const hospital = dispatch.hospitalId ? hospitalModel.getById(dispatch.hospitalId) : null;
    const ambulance = dispatch.ambulanceId ? ambulanceModel.getById(dispatch.ambulanceId) : null;

    return {
      emergency: emergencyModel.getById(emergencyId),
      dispatch,
      hospital,
      ambulance,
      decision: dispatch.rankingSnapshot,
    };
  },

  listActivity(limit = 20) {
    return activityLogModel.list(limit);
  },
};
