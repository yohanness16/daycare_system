import { apiClient } from '../api/api-client';
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginCredentials,
  PasswordPolicy,
  RegisterCredentials,
  UserProfileResponse,
} from './types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials, {
      skipAuth: true,
    } as Record<string, unknown>);
    if (response?.accessToken) {
      apiClient.setToken(response.accessToken);
    }
    return response;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/register', credentials);
  },

  async refreshToken(refreshToken?: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/refresh-token',
      refreshToken ? { refreshToken } : {},
      { skipAuth: true } as Record<string, unknown>
    );
    if (response?.accessToken) {
      apiClient.setToken(response.accessToken);
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignored if session is already expired
    } finally {
      apiClient.clearToken();
    }
  },

  async changePassword(request: ChangePasswordRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/change-password', request);
    if (response?.accessToken) {
      apiClient.setToken(response.accessToken);
    }
    return response;
  },

  async getProfile(): Promise<UserProfileResponse> {
    return apiClient.get<UserProfileResponse>('/api/auth/me');
  },

  async getPasswordPolicy(): Promise<PasswordPolicy> {
    return apiClient.request<PasswordPolicy>('/api/auth/password-policy', {
      method: 'GET',
      skipAuth: true,
    });
  },
};
