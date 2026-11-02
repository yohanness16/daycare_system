import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import { enrollmentStatusToNumber, enrollmentStatusToString } from '../../core/types/enums';
import type {
  BackendEnrollmentResponse,
  EnrollChildDto,
  Enrollment,
  EnrollmentFilterOptions,
  TransferChildClassroomDto,
} from './types';

function mapEnrollment(item: BackendEnrollmentResponse): Enrollment {
  return {
    id: item.id,
    childId: item.childId,
    childName: item.childName,
    classroomId: item.classroomId,
    classroomName: item.classroomName,
    status: enrollmentStatusToString(item.status),
    enrollmentDate: item.enrollmentDate,
    endDate: item.endDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const enrollmentApi = {
  async getAll(filters?: EnrollmentFilterOptions): Promise<Enrollment[]> {
    const params: Record<string, unknown> = {};
    if (filters?.classroomId) params.classroomId = filters.classroomId;
    if (filters?.childId) params.childId = filters.childId;
    if (filters?.status !== undefined) {
      params.status = enrollmentStatusToNumber(filters.status);
    }
    const list = await apiClient.get<BackendEnrollmentResponse[]>('/api/enrollments', params);
    return list.map(mapEnrollment);
  },

  async getById(id: UUID): Promise<Enrollment> {
    const item = await apiClient.get<BackendEnrollmentResponse>(`/api/enrollments/${id}`);
    return mapEnrollment(item);
  },

  async getByClassroom(classroomId: UUID, activeOnly = true): Promise<Enrollment[]> {
    const list = await apiClient.get<BackendEnrollmentResponse[]>(
      `/api/enrollments/classroom/${classroomId}`,
      { activeOnly }
    );
    return list.map(mapEnrollment);
  },

  async getByChild(childId: UUID): Promise<Enrollment[]> {
    const list = await apiClient.get<BackendEnrollmentResponse[]>(
      `/api/enrollments/child/${childId}`
    );
    return list.map(mapEnrollment);
  },

  async enroll(dto: EnrollChildDto): Promise<Enrollment> {
    const res = await apiClient.post<BackendEnrollmentResponse>('/api/enrollments', dto);
    return mapEnrollment(res);
  },

  async transfer(dto: TransferChildClassroomDto): Promise<Enrollment> {
    const res = await apiClient.post<BackendEnrollmentResponse>('/api/enrollments/transfer', dto);
    return mapEnrollment(res);
  },

  async endEnrollment(id: UUID): Promise<Enrollment> {
    const res = await apiClient.post<BackendEnrollmentResponse>(`/api/enrollments/${id}/end`);
    return mapEnrollment(res);
  },
};
