const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ data: T }> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

    const impersonationToken = typeof window !== 'undefined'
      ? sessionStorage.getItem('impersonation_token')
      : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (impersonationToken) {
      headers['X-Impersonation-Token'] = impersonationToken;
    }

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

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

  async post<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<{ data: T }> {
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
}

export const api = new ApiClient(API_URL);
