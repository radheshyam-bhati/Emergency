import { apiRequest } from "./client";
import type { DashboardMetrics } from "@/types/domain";

export const getMetrics = () => apiRequest<DashboardMetrics>("/metrics");
