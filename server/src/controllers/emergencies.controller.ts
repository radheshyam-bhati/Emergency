import type { Request, Response } from "express";
import { z } from "zod";
import { activityLogModel } from "../models/activity-log.model.js";
import { emergencyModel } from "../models/emergency.model.js";
import { readModelService } from "../services/read-model.service.js";
import { seaeService } from "../services/seae.service.js";
import { toLegacyDispatchSteps } from "../utils/decision.js";

const createEmergencySchema = z.object({
  patientName: z.string().min(2),
  patientPhone: z.string().optional(),
  condition: z.string().min(2),
  severity: z.enum(["critical", "serious", "moderate", "minor"]),
  pickupAddress: z.string().min(4),
  pickupLatitude: z.number(),
  pickupLongitude: z.number(),
});

export const emergenciesController = {
  list(_request: Request, response: Response) {
    return response.json(readModelService.listEmergencies());
  },

  create(request: Request, response: Response) {
    const result = createEmergencySchema.safeParse(request.body);

    if (!result.success || !request.user) {
      return response.status(400).json({ message: "Invalid emergency payload" });
    }

    const emergency = emergencyModel.create({
      ...result.data,
      createdByUserId: request.user.id,
    });

    activityLogModel.add(
      "emergency",
      emergency.id,
      "emergency",
      `Emergency intake received for ${emergency.patientName} at ${emergency.pickupAddress}`,
      { severity: emergency.severity, condition: emergency.condition },
    );

    return response.status(201).json(emergency);
  },

  async createAndAssign(request: Request, response: Response) {
    const result = createEmergencySchema.safeParse(request.body);

    if (!result.success || !request.user) {
      return response.status(400).json({ message: "Invalid emergency payload" });
    }

    try {
      const created = await seaeService.createAndAssignEmergency({
        ...result.data,
        createdByUserId: request.user.id,
      });
      const readModel = readModelService.getDispatch(created.emergency.id);

      if (!readModel?.emergency) {
        return response.status(500).json({ message: "Failed to build dispatch response" });
      }

      return response.status(201).json({
        emergency: readModel.emergency,
        dispatch: readModel.dispatch,
        hospital: readModel.hospital,
        ambulance: readModel.ambulance,
        decision: readModel.decision,
        steps: toLegacyDispatchSteps(readModel.decision.replay),
      });
    } catch (error) {
      return response.status(500).json({
        message: error instanceof Error ? error.message : "Failed to create and assign emergency",
      });
    }
  },
};
