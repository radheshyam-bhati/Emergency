import type { Request, Response } from "express";
import { z } from "zod";
import { activityLogModel } from "../models/activity-log.model.js";
import { ambulanceModel } from "../models/ambulance.model.js";
import { readModelService } from "../services/read-model.service.js";

const updateStatusSchema = z.object({
  status: z.enum(["available", "queued", "assigned", "en-route", "at-hospital"]),
});

export const ambulancesController = {
  list(_request: Request, response: Response) {
    return response.json(readModelService.listAmbulances());
  },

  updateStatus(request: Request, response: Response) {
    const result = updateStatusSchema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({ message: "Invalid ambulance status payload" });
    }

    const ambulanceId = Number(request.params.id);
    const ambulance = ambulanceModel.getById(ambulanceId);

    if (!ambulance) {
      return response.status(404).json({ message: "Ambulance not found" });
    }

    ambulanceModel.updateStatus(ambulanceId, result.data.status);
    activityLogModel.add(
      "ambulance",
      ambulanceId,
      "status",
      `Ambulance ${ambulance.vehicleNumber} status updated to ${result.data.status}`,
    );

    return response.json(ambulanceModel.getById(ambulanceId));
  },
};
