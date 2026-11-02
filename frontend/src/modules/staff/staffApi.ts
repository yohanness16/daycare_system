import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import { staffRoleToNumber, staffRoleToString } from '../../core/types/enums';
import type {
  BackendStaffResponse,
  CreateStaffDto,
  ResetStaffPasswordResponse,
  Staff,
  StaffDependentsResponse,
  UpdateStaffDto,
} from './types';

function mapStaff(item: BackendStaffResponse): Staff {
  return {
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    email: item.email,
    address: item.address,
    role: staffRoleToString(item.role),
    photoUrl: item.photoUrl,
    defaultPassword: item.defaultPassword,
    isActive: item.isActive !== false,
    deactivatedAt: item.deactivatedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const staffApi = {
  async getAll(isActive?: string): Promise<Staff[]> {
    const params = isActive !== undefined ? { isActive } : undefined;
    const list = await apiClient.get<BackendStaffResponse[]>('/api/staff', params);
    return list.map(mapStaff);
  },

  async getById(id: UUID): Promise<Staff> {
    const item = await apiClient.get<BackendStaffResponse>(`/api/staff/${id}`);
    return mapStaff(item);
  },

  async create(dto: CreateStaffDto): Promise<Staff> {
    const payload = {
      ...dto,
      role: staffRoleToNumber(dto.role),
    };
    const created = await apiClient.post<BackendStaffResponse>('/api/staff', payload);
    return mapStaff(created);
  },

  async update(id: UUID, dto: UpdateStaffDto): Promise<Staff> {
    const payload = {
      ...dto,
      role: staffRoleToNumber(dto.role),
    };
    const updated = await apiClient.put<BackendStaffResponse>(`/api/staff/${id}`, payload);
    return mapStaff(updated);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/staff/${id}`);
  },

  async deactivate(id: UUID): Promise<Staff> {
    const item = await apiClient.post<BackendStaffResponse>(`/api/staff/${id}/deactivate`);
    return mapStaff(item);
  },

  async reactivate(id: UUID): Promise<Staff> {
    const item = await apiClient.post<BackendStaffResponse>(`/api/staff/${id}/reactivate`);
    return mapStaff(item);
  },

  async resetPassword(id: UUID): Promise<ResetStaffPasswordResponse> {
    return apiClient.post<ResetStaffPasswordResponse>(`/api/staff/${id}/reset-password`);
  },

  async getDependents(id: UUID): Promise<StaffDependentsResponse> {
    return apiClient.get<StaffDependentsResponse>(`/api/staff/${id}/dependents`);
  },

  async updatePhoto(id: UUID, photoUrl: string): Promise<{ id: UUID; photoUrl: string }> {
    return apiClient.patch<{ id: UUID; photoUrl: string }>(`/api/staff/${id}/photo`, { photoUrl });
  },
};
