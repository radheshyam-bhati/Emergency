import { apiRequest } from "./client";
import type { ActivityLog } from "@/types/domain";

export const getActivity = (limit = 20) => apiRequest<ActivityLog[]>(`/activity?limit=${limit}`);
