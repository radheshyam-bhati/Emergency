import { apiRequest } from "./client";
import type { AuthSession, AuthUser } from "@/types/domain";

export const login = (email: string, password: string) =>
  apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const signUp = (email: string, password: string, fullName: string, role: string) =>
  apiRequest<AuthSession>("/auth/signup", {
    method: "POST",
    body: { email, password, fullName, role },
  });

export const getCurrentUser = () => apiRequest<{ user: AuthUser }>("/auth/me");
