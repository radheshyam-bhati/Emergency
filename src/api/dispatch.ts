import { apiRequest } from "./client";
import type { DispatchDetailResponse, EmergencySeverity, RankingSnapshot } from "@/types/domain";

export interface DispatchPreviewPayload {
  condition: string;
  severity: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

export const previewDispatch = (payload: DispatchPreviewPayload) =>
  apiRequest<{ decision: RankingSnapshot }>("/dispatch/preview", {
    method: "POST",
    body: payload,
  });

export const assignDispatch = (emergencyId: number) =>
  apiRequest<DispatchDetailResponse>(`/dispatch/${emergencyId}/assign`, {
    method: "POST",
  });

export const getDispatch = (emergencyId: number) =>
  apiRequest<DispatchDetailResponse>(`/dispatch/${emergencyId}`);
