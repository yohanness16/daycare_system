import type { UUID } from '../types/common';

export interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffId?: UUID | null;
  staffName?: string | null;
  guardianId?: UUID | null;
  guardianName?: string | null;
  childId?: UUID | null;
  childName?: string | null;
  childrenCount?: number;
  mustChangePassword?: boolean;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  staffId?: UUID | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffId?: UUID | null;
  guardianId?: UUID | null;
  childId?: UUID | null;
  childName?: string | null;
  mustChangePassword: boolean;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface UserProfileResponse {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffId?: UUID | null;
  staffName?: string | null;
  guardianId?: UUID | null;
  guardianName?: string | null;
  childId?: UUID | null;
  childName?: string | null;
  childrenCount?: number;
  mustChangePassword: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
}

export interface AdminResetPasswordResponse {
  userId: UUID;
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}
