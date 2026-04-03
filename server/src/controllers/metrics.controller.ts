import type { Request, Response } from "express";
import { metricsService } from "../services/metrics.service.js";

export const metricsController = {
  detail(_request: Request, response: Response) {
    return response.json(metricsService.getDashboardMetrics());
  },
};
