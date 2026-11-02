export interface ApiErrorBody {
  status: number;
  title: string;
  detail: string;
  code?: string;
  errors?: Record<string, string[]>;
  dependents?: Record<string, number | unknown>;
  retryAfterSeconds?: number;
  traceId?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
  dependents?: Record<string, number | unknown>;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    statusText: string,
    detail?: string,
    errors?: Record<string, string[]>,
    code?: string,
    dependents?: Record<string, number | unknown>,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
    this.errors = errors;
    this.code = code;
    this.dependents = dependents;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, unknown>;
  body?: unknown;
  skipAuth?: boolean;
}

type RefreshSubscriber = (newToken: string | null) => void;

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];
  private onUnauthorizedCallback?: () => void;

  constructor(baseUrl = import.meta.env.VITE_API_URL || '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = this.getStoredToken();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = this.getStoredToken();
    }
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('daycare_token', token);
    } else {
      localStorage.removeItem('daycare_token');
    }
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('daycare_token');
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('daycare_token');
    } catch {
      return null;
    }
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let fullUrl: string;

    if (this.baseUrl) {
      if (this.baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
        fullUrl = `${this.baseUrl}${cleanPath.substring(4)}`;
      } else {
        fullUrl = `${this.baseUrl}${cleanPath}`;
      }
    } else {
      fullUrl = cleanPath;
    }

    if (!params) return fullUrl;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          val.forEach((item) => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(val));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  private subscribeTokenRefresh(cb: RefreshSubscriber) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(newToken: string | null) {
    this.refreshSubscribers.forEach((cb) => cb(newToken));
    this.refreshSubscribers = [];
  }

  private async attemptRefreshToken(): Promise<string | null> {
    try {
      const refreshUrl = this.buildUrl('/api/auth/refresh-token');
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.accessToken || data.token;
      if (newAccessToken) {
        this.setToken(newAccessToken);
        return newAccessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, headers: customHeaders, skipAuth, ...restOptions } = options;
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const currentToken = this.getToken();
    if (!skipAuth && currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const fetchOptions: RequestInit = {
      ...restOptions,
      headers,
      credentials: 'include',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    };

    let response = await fetch(url, fetchOptions);

    // Handle 401 Unauthorized with token refresh (avoid infinite loops for auth routes)
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/refresh-token');
    if (response.status === 401 && !skipAuth && !isAuthRoute && currentToken) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.attemptRefreshToken();
        this.isRefreshing = false;
        this.onTokenRefreshed(newToken);

        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...fetchOptions, headers });
        } else {
          this.clearToken();
          this.onUnauthorizedCallback?.();
        }
      } else {
        // Wait for current refresh to complete
        const retryToken = await new Promise<string | null>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });

        if (retryToken) {
          headers['Authorization'] = `Bearer ${retryToken}`;
          response = await fetch(url, { ...fetchOptions, headers });
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      let detail: string | undefined;
      let validationErrors: Record<string, string[]> | undefined;

      let code: string | undefined;
      let dependents: Record<string, number | unknown> | undefined;
      let retryAfterSeconds: number | undefined;

      try {
        const errorJson = await response.json();
        if (typeof errorJson === 'object' && errorJson !== null) {
          detail = errorJson.detail || errorJson.message || errorJson.title;
          validationErrors = errorJson.errors;
          code = errorJson.code;
          dependents = errorJson.dependents;
          retryAfterSeconds = errorJson.retryAfterSeconds;
          errorMessage = detail || errorJson.title || errorMessage;

          if (validationErrors) {
            const firstErrField = Object.keys(validationErrors)[0];
            if (firstErrField && validationErrors[firstErrField]?.[0]) {
              errorMessage = `${firstErrField}: ${validationErrors[firstErrField][0]}`;
            }
          }
        }
      } catch {
        // response was not JSON
      }

      throw new ApiError(errorMessage, response.status, response.statusText, detail, validationErrors, code, dependents, retryAfterSeconds);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  public get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  public post<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, params });
  }

  public put<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, params });
  }

  public patch<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body, params });
  }

  public delete<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', params });
  }
}

export const apiClient = new ApiClient();
