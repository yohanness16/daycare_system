import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import type { Child, ChildDailyHistoryResponse, RegisterChildDto, UpdateChildDto } from './types';

export interface ChildDependentsResponse {
  enrollments: number;
  attendances: number;
  meals: number;
  activities: number;
}

export const childrenApi = {
  async getAll(): Promise<Child[]> {
    return apiClient.get<Child[]>('/api/children');
  },

  async getById(id: UUID): Promise<Child> {
    return apiClient.get<Child>(`/api/children/${id}`);
  },

  async register(dto: RegisterChildDto): Promise<Child> {
    return apiClient.post<Child>('/api/children', dto);
  },

  async update(id: UUID, dto: UpdateChildDto): Promise<Child> {
    return apiClient.put<Child>(`/api/children/${id}`, dto);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/children/${id}`);
  },

  async getDependents(id: UUID): Promise<ChildDependentsResponse> {
    return apiClient.get<ChildDependentsResponse>(`/api/children/${id}/dependents`);
  },

  async getDailyHistory(id: UUID, date?: string): Promise<ChildDailyHistoryResponse> {
    return apiClient.get<ChildDailyHistoryResponse>(
      `/api/children/${id}/daily-history`,
      date ? { date } : undefined
    );
  },

  async updatePhoto(id: UUID, photoUrl: string): Promise<{ id: UUID; photoUrl: string }> {
    return apiClient.patch<{ id: UUID; photoUrl: string }>(`/api/children/${id}/photo`, { photoUrl });
  },
};
