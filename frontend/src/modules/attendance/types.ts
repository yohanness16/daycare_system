import type { UUID } from '../../core/types/common';

export interface Attendance {
  id: UUID;
  childId: UUID;
  childName: string;
  date: string; // YYYY-MM-DD
  arrivalTime?: string | null;
  departureTime?: string | null;
  isPresent: boolean;
  recordedById?: UUID | null;
  recordedByName?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecordAttendanceDto {
  childId: UUID;
  date?: string;
  arrivalTime?: string;
  exitTime?: string;
  note?: string;
  recordedById?: UUID;
}

export interface CheckOutAttendanceDto {
  childId: UUID;
  date?: string;
  exitTime?: string;
  note?: string;
  recordedById?: UUID;
}
