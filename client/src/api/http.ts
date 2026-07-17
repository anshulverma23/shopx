// Lightweight fetch wrapper used by every module in src/api. Attaches the
// stored access token to every request and transparently refreshes it once
// if a request comes back 401, so callers never have to think about tokens.

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

const ACCESS_TOKEN_KEY = "shopx_access_token";
const REFRESH_TOKEN_KEY = "shopx_refresh_token";
const USER_KEY = "shopx_user";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeSession(accessToken: string, refreshToken: string, user?: unknown) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = await r.json();
        storeSession(data.accessToken, data.refreshToken, data.user);
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: unknown;
  /** internal — prevents infinite refresh loops */
  _retried?: boolean;
}

function buildUrl(path: string, params?: ApiRequestOptions["params"]): string {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    }
    const qsString = qs.toString();
    if (qsString) url += `?${qsString}`;
  }
  return url;
}

export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", params, data, _retried } = options;

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const res = await fetch(buildUrl(path, params), { method, headers, body });

  if (res.status === 401 && !_retried && getRefreshToken() && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
    clearSession();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "error" in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).error)
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}
