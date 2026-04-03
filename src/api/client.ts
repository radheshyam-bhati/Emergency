const API_BASE = "/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const getToken = () => window.localStorage.getItem("rapid-rescue-grid-token");

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const token = getToken();

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((payload as { message?: string }).message || "Request failed");
  }

  return payload as T;
}
