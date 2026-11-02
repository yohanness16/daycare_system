import React, { createContext, useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '../api/api-client';
import { authApi } from './authApi';
import type {
  AuthState,
  ChangePasswordRequest,
  LoginCredentials,
  RegisterCredentials,
  User,
} from './types';

export interface LoginResult {
  success: boolean;
  error?: {
    message: string;
    code?: string;
    retryAfterSeconds?: number;
  };
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  changePassword: (request: ChangePasswordRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  mustChangePassword: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isParent: boolean;
  hasRole: (role: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('daycare_token');
      localStorage.removeItem('daycare_user');
      apiClient.clearToken();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!apiClient.getToken()) return;
    try {
      const profile = await authApi.getProfile();
      const updatedUser: User = {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        staffId: profile.staffId,
        staffName: profile.staffName,
        guardianId: profile.guardianId,
        guardianName: profile.guardianName,
        childId: profile.childId,
        childName: profile.childName,
        childrenCount: profile.childrenCount,
        mustChangePassword: profile.mustChangePassword,
      };
      setUser(updatedUser);
      localStorage.setItem('daycare_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, []);

  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      logout();
    });

    const initAuth = async () => {
      const storedToken = apiClient.getToken();
      const storedUser = localStorage.getItem('daycare_user');

      if (storedToken) {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('daycare_user');
          }
        }

        // Validate token against backend
        try {
          const profile = await authApi.getProfile();
          const liveUser: User = {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
            staffId: profile.staffId,
            staffName: profile.staffName,
            guardianId: profile.guardianId,
            guardianName: profile.guardianName,
            childId: profile.childId,
            childName: profile.childName,
            childrenCount: profile.childrenCount,
            mustChangePassword: profile.mustChangePassword,
          };
          setUser(liveUser);
          setToken(storedToken);
          localStorage.setItem('daycare_user', JSON.stringify(liveUser));
        } catch {
          // Token is invalid/expired
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      const authenticatedUser: User = {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        staffId: response.staffId,
        guardianId: response.guardianId,
        childId: response.childId,
        childName: response.childName,
        mustChangePassword: response.mustChangePassword,
      };

      setUser(authenticatedUser);
      setToken(response.accessToken);
      localStorage.setItem('daycare_token', response.accessToken);
      localStorage.setItem('daycare_user', JSON.stringify(authenticatedUser));
      return { success: true };
    } catch (err) {
      let msg = 'Login failed';
      let code: string | undefined;
      let retryAfterSeconds: number | undefined;

      if (err instanceof ApiError) {
        msg = err.message;
        code = err.code;
        retryAfterSeconds = err.retryAfterSeconds;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      setError(msg);
      return {
        success: false,
        error: {
          message: msg,
          code,
          retryAfterSeconds,
        },
      };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (request: ChangePasswordRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.changePassword(request);
      const updatedUser: User = {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        staffId: response.staffId,
        guardianId: response.guardianId,
        mustChangePassword: response.mustChangePassword,
      };

      setUser(updatedUser);
      setToken(response.accessToken);
      localStorage.setItem('daycare_token', response.accessToken);
      localStorage.setItem('daycare_user', JSON.stringify(updatedUser));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(credentials);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'administrator';
  const isStaff = isAdmin || role === 'staff' || role === 'teacher';
  const isParent = role === 'parent' || role === 'guardian';
  const mustChangePassword = Boolean(user?.mustChangePassword);

  const hasRole = (targetRole: string) => {
    if (!user?.role) return false;
    return user.role.toLowerCase() === targetRole.toLowerCase();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        register,
        changePassword,
        logout,
        refreshProfile,
        mustChangePassword,
        isAdmin,
        isStaff,
        isParent,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
