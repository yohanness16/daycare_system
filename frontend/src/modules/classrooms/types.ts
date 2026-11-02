import type { EntityTimestamps, UUID } from '../../core/types/common';

export interface Classroom extends EntityTimestamps {
  id: UUID;
  name: string;
  capacity: number;
  currentEnrollmentCount?: number;
}

export interface CreateClassroomDto {
  name: string;
  capacity: number;
}

export interface UpdateClassroomDto {
  name: string;
  capacity: number;
}

export interface ClassroomStaffAssignment {
  id: UUID;
  classroomId: UUID;
  classroomName: string;
  staffId: UUID;
  staffName: string;
  assignedAt: string;
  endedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignStaffToClassroomDto {
  classroomId: UUID;
  staffId: UUID;
  assignedAt?: string;
}
