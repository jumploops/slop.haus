const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiError {
  error: string;
  code?: string;
  details?: Array<{ path: string[]; message: string }>;
  retryAfter?: number;
}

export class ApiResponseError extends Error {
  status: number;
  code?: string;
  details?: Array<{ path: string[]; message: string }>;
  retryAfter?: number;

  constructor(message: string, status: number, data?: ApiError) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.code = data?.code;
    this.details = data?.details;
    this.retryAfter = data?.retryAfter;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | undefined;
    try {
      errorData = await response.json();
    } catch {
      // Response body not JSON
    }
    throw new ApiResponseError(
      errorData?.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse<T>(response);
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    method: "POST",
    credentials: "include",
    // Note: Don't set Content-Type for FormData, browser sets it with boundary
    body: formData,
  });
  return handleResponse<T>(response);
}

// Default fetcher for SWR
export const fetcher = <T>(path: string): Promise<T> => apiGet<T>(path);
