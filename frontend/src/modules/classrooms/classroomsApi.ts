import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import type {
  AssignStaffToClassroomDto,
  Classroom,
  ClassroomStaffAssignment,
  CreateClassroomDto,
  UpdateClassroomDto,
} from './types';

export interface ClassroomDependentsResponse {
  activeEnrollments: number;
  activeStaff: number;
}

export const classroomsApi = {
  async getAll(): Promise<Classroom[]> {
    return apiClient.get<Classroom[]>('/api/classrooms');
  },

  async getById(id: UUID): Promise<Classroom> {
    return apiClient.get<Classroom>(`/api/classrooms/${id}`);
  },

  async create(dto: CreateClassroomDto): Promise<Classroom> {
    return apiClient.post<Classroom>('/api/classrooms', dto);
  },

  async update(id: UUID, dto: UpdateClassroomDto): Promise<Classroom> {
    return apiClient.put<Classroom>(`/api/classrooms/${id}`, dto);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/classrooms/${id}`);
  },

  async getDependents(id: UUID): Promise<ClassroomDependentsResponse> {
    return apiClient.get<ClassroomDependentsResponse>(`/api/classrooms/${id}/dependents`);
  },

  // ClassroomStaff endpoints
  async getStaffByClassroom(
    classroomId: UUID,
    activeOnly = true
  ): Promise<ClassroomStaffAssignment[]> {
    return apiClient.get<ClassroomStaffAssignment[]>(
      `/api/classroomstaff/classroom/${classroomId}`,
      { activeOnly }
    );
  },

  async getClassroomsByStaff(
    staffId: UUID,
    activeOnly = true
  ): Promise<ClassroomStaffAssignment[]> {
    return apiClient.get<ClassroomStaffAssignment[]>(`/api/classroomstaff/staff/${staffId}`, {
      activeOnly,
    });
  },

  async assignStaff(dto: AssignStaffToClassroomDto): Promise<ClassroomStaffAssignment> {
    return apiClient.post<ClassroomStaffAssignment>('/api/classroomstaff', dto);
  },

  async removeStaffAssignment(assignmentId: UUID): Promise<ClassroomStaffAssignment> {
    return apiClient.delete<ClassroomStaffAssignment>(`/api/classroomstaff/${assignmentId}`);
  },
};
