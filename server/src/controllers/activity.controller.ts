import type { Request, Response } from "express";
import { readModelService } from "../services/read-model.service.js";

export const activityController = {
  list(request: Request, response: Response) {
    const requestedLimit = Number(request.query.limit ?? 20);
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1),
      100,
    );

    return response.json(readModelService.listActivity(limit));
  },
};
