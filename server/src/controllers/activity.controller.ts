import type { Request, Response } from "express";
import { readModelService } from "../services/read-model.service.js";

export const activityController = {
  list(request: Request, response: Response) {
    const limit = Number(request.query.limit ?? 20);
    return response.json(readModelService.listActivity(Number.isFinite(limit) ? limit : 20));
  },
};
