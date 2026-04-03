import { apiRequest } from "./client";
import type { DispatchDetailResponse, Emergency, EmergencySeverity } from "@/types/domain";

export interface CreateEmergencyPayload {
  patientName: string;
  patientPhone?: string;
  condition: string;
  severity: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

export const getEmergencies = () => apiRequest<Emergency[]>("/emergencies");

export const createEmergency = (payload: CreateEmergencyPayload) =>
  apiRequest<Emergency>("/emergencies", {
    method: "POST",
    body: payload,
  });

export const createEmergencyAndAssign = (payload: CreateEmergencyPayload) =>
  apiRequest<DispatchDetailResponse>("/emergencies/create-and-assign", {
    method: "POST",
    body: payload,
  });
