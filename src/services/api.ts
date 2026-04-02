import { supabase } from "@/integrations/supabase/client";

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type RequestMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

interface EdgeFunctionRequest {
  method?: RequestMethod;
  body?: unknown;
}

export interface DispatchRequest {
  condition_type: string;
  severity: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address?: string;
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  bed_type?: string;
}

async function invokeEdgeFunction<TResponse>(
  functionName: string,
  path = "",
  { method = "GET", body }: EdgeFunctionRequest = {},
): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const functionPath = path ? `/${path}` : "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: publishableKey,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/${functionName}${functionPath}`,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  return response.json() as Promise<TResponse>;
}

export const dispatchApi = {
  dispatch: <TResponse = unknown>(request: DispatchRequest) =>
    invokeEdgeFunction<TResponse>("dispatch-emergency", "", {
      method: "POST",
      body: request,
    }),
};
