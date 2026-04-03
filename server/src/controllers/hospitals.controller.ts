import type { Request, Response } from "express";
import { readModelService } from "../services/read-model.service.js";

export const hospitalsController = {
  list(_request: Request, response: Response) {
    return response.json(readModelService.listHospitals());
  },

  detail(request: Request, response: Response) {
    const hospital = readModelService.getHospitalById(Number(request.params.id));

    if (!hospital) {
      return response.status(404).json({ message: "Hospital not found" });
    }

    return response.json(hospital);
  },
};
