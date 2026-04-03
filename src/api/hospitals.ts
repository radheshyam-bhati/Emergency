import { apiRequest } from "./client";
import type { Hospital } from "@/types/domain";

export const getHospitals = () => apiRequest<Hospital[]>("/hospitals");
export const getHospital = (hospitalId: number) => apiRequest<Hospital>(`/hospitals/${hospitalId}`);
