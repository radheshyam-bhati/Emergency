import { apiRequest } from "./client";
import type { Ambulance, AmbulanceStatus } from "@/types/domain";

export const getAmbulances = () => apiRequest<Ambulance[]>("/ambulances");

export const updateAmbulanceStatus = (ambulanceId: number, status: AmbulanceStatus) =>
  apiRequest<Ambulance>(`/ambulances/${ambulanceId}/status`, {
    method: "PATCH",
    body: { status },
  });
