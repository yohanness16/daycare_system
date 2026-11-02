import type { UUID } from '../../core/types/common';
import type { StaffRole } from '../../core/types/enums';

export interface Staff {
  id: UUID;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  role: StaffRole;
  photoUrl?: string | null;
  defaultPassword?: string | null;
  isActive?: boolean;
  deactivatedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendStaffResponse {
  id: UUID;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  role: number | StaffRole;
  photoUrl?: string | null;
  defaultPassword?: string | null;
  isActive?: boolean;
  deactivatedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StaffDependentsResponse {
  mealRecords: number;
  attendanceRecords: number;
  activityRecords: number;
  activeClassrooms: number;
}

export interface ResetStaffPasswordResponse {
  userId: string;
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  role: StaffRole | number;
  photoUrl?: string | null;
}

export interface UpdateStaffDto {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  role: StaffRole | number;
  photoUrl?: string | null;
}
