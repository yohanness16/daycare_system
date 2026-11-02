import { apiClient } from '../../core/api/api-client';
import type { AcknowledgeIncidentDto, CreateIncidentDto, IncidentReport } from './types';

export const incidentsApi = {
  async getAll(params?: {
    childId?: string;
    classroomId?: string;
    date?: string;
  }): Promise<IncidentReport[]> {
    return apiClient.get<IncidentReport[]>('/api/incidents', params);
  },

  async getById(id: string): Promise<IncidentReport> {
    return apiClient.get<IncidentReport>(`/api/incidents/${id}`);
  },

  async getByChild(childId: string): Promise<IncidentReport[]> {
    return apiClient.get<IncidentReport[]>(`/api/incidents/child/${childId}`);
  },

  async create(dto: CreateIncidentDto): Promise<IncidentReport> {
    return apiClient.post<IncidentReport>('/api/incidents', dto);
  },

  async acknowledge(id: string, dto: AcknowledgeIncidentDto): Promise<IncidentReport> {
    return apiClient.post<IncidentReport>(`/api/incidents/${id}/acknowledge`, dto);
  },
};
