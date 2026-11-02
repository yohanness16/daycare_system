import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import type { CreateGuardianDto, Guardian, UpdateGuardianDto } from './types';

export interface GuardianDependentsResponse {
  children: number;
}

export const guardiansApi = {
  async getAll(searchTerm?: string): Promise<Guardian[]> {
    return apiClient.get<Guardian[]>('/api/guardians', searchTerm ? { searchTerm } : undefined);
  },

  async getById(id: UUID): Promise<Guardian> {
    return apiClient.get<Guardian>(`/api/guardians/${id}`);
  },

  async create(dto: CreateGuardianDto): Promise<Guardian> {
    return apiClient.post<Guardian>('/api/guardians', dto);
  },

  async update(id: UUID, dto: UpdateGuardianDto): Promise<Guardian> {
    return apiClient.put<Guardian>(`/api/guardians/${id}`, dto);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/guardians/${id}`);
  },

  async getDependents(id: UUID): Promise<GuardianDependentsResponse> {
    return apiClient.get<GuardianDependentsResponse>(`/api/guardians/${id}/dependents`);
  },

  async updatePhoto(id: UUID, photoUrl: string): Promise<{ id: UUID; photoUrl: string }> {
    return apiClient.patch<{ id: UUID; photoUrl: string }>(`/api/guardians/${id}/photo`, { photoUrl });
  },
};
