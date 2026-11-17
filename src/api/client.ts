const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const API_BASE = `${configuredApiUrl ?? ""}/api`;
const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const getToken = () => window.localStorage.getItem("rapid-rescue-grid-token");

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const token = getToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    if (!response.ok) {
      throw new Error((payload as { message?: string }).message || "Request failed");
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
