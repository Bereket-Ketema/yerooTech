/**
 * Resolve the API base URL dynamically:
 * 1. Server-side in Next.js runtime (SSR, Route Handlers, Server Actions):
 *    Uses Vercel's internal service binding `process.env.BACKEND_URL`.
 * 2. Explicit public API URL if configured via `NEXT_PUBLIC_API_URL`.
 * 3. Client-side browser in unified Vercel deployment:
 *    Uses same-origin relative `/api/v1` (routed by Vercel top-level rewrites).
 * 4. Fallback for standalone SSR in local dev:
 *    `http://127.0.0.1:8000/api/v1`.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    if (process.env.BACKEND_URL) {
      return `${process.env.BACKEND_URL.replace(/\/+$/, '')}/api/v1`;
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject JWT token if available in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // If token expired, clear tokens
    // We could attempt refresh token here
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && (contentType.includes('text/csv') || contentType.includes('application/pdf') || contentType.includes('spreadsheet'))) {
    // Return blob for exports
    return response.blob() as unknown as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    if (data && typeof data === 'object') {
      if (data.message) errorMsg = data.message;
      else if (data.detail) errorMsg = data.detail;
      else if (data.error && data.error.detail) errorMsg = JSON.stringify(data.error.detail);
      else errorMsg = JSON.stringify(data);
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

