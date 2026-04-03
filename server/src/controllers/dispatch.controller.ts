import type { Request, Response } from "express";
import { z } from "zod";
import { readModelService } from "../services/read-model.service.js";
import { seaeService } from "../services/seae.service.js";
import { toLegacyDispatchSteps } from "../utils/decision.js";

const previewSchema = z.object({
  condition: z.string().min(2),
  severity: z.enum(["critical", "serious", "moderate", "minor"]),
  pickupAddress: z.string().min(4),
  pickupLatitude: z.number(),
  pickupLongitude: z.number(),
});

export const dispatchController = {
  preview(request: Request, response: Response) {
    const result = previewSchema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({ message: "Invalid dispatch preview payload" });
    }

    const decision = seaeService.preview(result.data);
    return response.json({ decision });
  },

  async assign(request: Request, response: Response) {
    try {
      const emergencyId = Number(request.params.emergencyId);
      await seaeService.assignEmergency(emergencyId);
      const readModel = readModelService.getDispatch(emergencyId);

      if (!readModel?.emergency) {
        return response.status(404).json({ message: "Dispatch not found" });
      }

      return response.json({
        emergency: readModel.emergency,
        dispatch: readModel.dispatch,
        hospital: readModel.hospital,
        ambulance: readModel.ambulance,
        decision: readModel.decision,
        steps: toLegacyDispatchSteps(readModel.decision.replay),
      });
    } catch (error) {
      return response.status(404).json({ message: error instanceof Error ? error.message : "Dispatch failed" });
    }
  },

  detail(request: Request, response: Response) {
    const emergencyId = Number(request.params.emergencyId);
    const dispatch = readModelService.getDispatch(emergencyId);

    if (!dispatch) {
      return response.status(404).json({ message: "Dispatch not found" });
    }

    return response.json({
      emergency: dispatch.emergency,
      dispatch: dispatch.dispatch,
      hospital: dispatch.hospital,
      ambulance: dispatch.ambulance,
      decision: dispatch.decision,
      steps: toLegacyDispatchSteps(dispatch.decision.replay),
    });
  },
};
