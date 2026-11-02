import type { UUID } from '../../core/types/common';
import type { EnrollmentStatus } from '../../core/types/enums';

export interface Enrollment {
  id: UUID;
  childId: UUID;
  childName: string;
  classroomId: UUID;
  classroomName: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendEnrollmentResponse {
  id: UUID;
  childId: UUID;
  childName: string;
  classroomId: UUID;
  classroomName: string;
  status: number | EnrollmentStatus;
  enrollmentDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollChildDto {
  childId: UUID;
  classroomId: UUID;
  enrollmentDate: string;
}

export interface TransferChildClassroomDto {
  childId: UUID;
  newClassroomId: UUID;
  transferDate?: string;
}

export interface EnrollmentFilterOptions {
  classroomId?: UUID;
  childId?: UUID;
  status?: EnrollmentStatus | number;
}
