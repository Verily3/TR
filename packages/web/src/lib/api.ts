/**
 * API base URL — empty string means relative URLs (works in production via Next.js rewrites).
 * Only set NEXT_PUBLIC_API_URL in local dev (.env.local) to point at localhost:3002.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds for JSON requests
const UPLOAD_TIMEOUT_MS = 120_000; // 2 minutes for file uploads

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};

    if (typeof window === 'undefined') return headers;

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const impersonationToken = sessionStorage.getItem('impersonation_token');
    if (impersonationToken) {
      headers['X-Impersonation-Token'] = impersonationToken;
    }

    return headers;
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Returns true if refresh succeeded, false otherwise.
   * Uses a mutex so concurrent 401s share a single refresh call.
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) return false;

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const result = await response.json();
        localStorage.setItem('accessToken', result.data.accessToken);
        if (result.data.refreshToken) {
          localStorage.setItem('refreshToken', result.data.refreshToken);
        }
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ data: T }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw err;
    }
    clearTimeout(timeoutId);

    // 401 — attempt token refresh and retry once
    if (response.status === 401 && !path.includes('/api/auth/') && !path.includes('/api/admin/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry with new token
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        };
        if (extraHeaders) Object.assign(retryHeaders, extraHeaders);

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), REQUEST_TIMEOUT_MS);
        try {
          response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: retryHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: retryController.signal,
          });
        } catch (err) {
          clearTimeout(retryTimeoutId);
          if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error('Request timed out');
          }
          throw err;
        }
        clearTimeout(retryTimeoutId);
      } else {
        // Refresh failed — clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message || 'Request failed');
    }

    return data;
  }

  async get<T>(path: string, extraHeaders?: Record<string, string>): Promise<{ data: T }> {
    return this.request<T>('GET', path, undefined, extraHeaders);
  }

  async post<T>(
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ data: T }> {
    return this.request<T>('POST', path, body, extraHeaders);
  }

  async put<T>(path: string, body?: unknown): Promise<{ data: T }> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<{ data: T }> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<{ data: T }> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Upload a file via multipart/form-data.
   * Do NOT set Content-Type — the browser auto-sets the multipart boundary.
   */
  async uploadFile<T>(path: string, formData: FormData): Promise<{ data: T }> {
    const headers: HeadersInit = { ...this.getAuthHeaders() };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Upload timed out');
      }
      throw err;
    }
    clearTimeout(timeoutId);

    // 401 — attempt token refresh and retry once
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryHeaders: HeadersInit = { ...this.getAuthHeaders() };
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), UPLOAD_TIMEOUT_MS);
        try {
          response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: retryHeaders,
            body: formData,
            signal: retryController.signal,
          });
        } catch (err) {
          clearTimeout(retryTimeoutId);
          if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error('Upload timed out');
          }
          throw err;
        }
        clearTimeout(retryTimeoutId);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message || 'Upload failed');
    }

    return data;
  }
}

export const api = new ApiClient(API_URL);
