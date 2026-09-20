/**
 * OPDly API Client
 * Transport layer utilizing standard browser cookies (HttpOnly, Secure, SameSite)
 * via credentials: 'include' and explicit CSRF protection header (x-csrf-token).
 *
 * Strict Security Rules:
 * - NO auth tokens or credentials in localStorage or sessionStorage.
 * - Same-origin cookies with credentials: 'include'.
 * - Automated CSRF token injection for all state-changing requests (POST, PUT, PATCH, DELETE).
 */

export class ApiClient {
  private baseUrl: string;
  private inMemoryCsrfToken: string | null = null;

  constructor(baseUrl?: string) {
    const envBase = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;
    this.baseUrl = baseUrl || envBase || '/api/v1';
  }

  /**
   * Updates in-memory CSRF token (never persisted to localStorage)
   */
  setCsrfToken(token: string | null): void {
    this.inMemoryCsrfToken = token;
  }

  /**
   * Retrieves CSRF token from in-memory cache or readable opdly_csrf cookie
   */
  getCsrfToken(): string | null {
    if (this.inMemoryCsrfToken) return this.inMemoryCsrfToken;

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)opdly_csrf=([^;]*)/);
      if (match && match[1]) {
        this.inMemoryCsrfToken = decodeURIComponent(match[1]);
        return this.inMemoryCsrfToken;
      }
    }
    return null;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Explicit CSRF Protection for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrf = this.getCsrfToken();
      if (csrf) {
        headers['x-csrf-token'] = csrf;
      }
    }

    const res = await fetch(url, {
      ...options,
      credentials: 'include', // Automatically sends and receives HttpOnly session cookies
      headers,
    });

    if (res.status === 401) {
      this.inMemoryCsrfToken = null;
      window.dispatchEvent(new CustomEvent('opdly:unauthorized'));
      throw new Error('Unauthorized');
    }

    if (res.status === 403) {
      const err = await res.json().catch(() => ({ error: 'Forbidden' }));
      throw new Error(err.error || 'Forbidden: Request rejected by security policy');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'API request failed' }));
      throw new Error(err.error || err.message || `HTTP ${res.status}`);
    }

    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json();

    // Cache CSRF token in memory if returned in response (e.g. login or me)
    if (data && typeof data === 'object' && 'csrfToken' in data && typeof data.csrfToken === 'string') {
      this.setCsrfToken(data.csrfToken);
    }

    return data as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const defaultApiClient = new ApiClient();
