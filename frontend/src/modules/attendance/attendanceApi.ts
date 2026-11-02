import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import type { Attendance, CheckOutAttendanceDto, RecordAttendanceDto } from './types';

function getValidStaffId(explicitId?: UUID | null): string | null {
  if (explicitId && explicitId !== '00000000-0000-0000-0000-000000000000') {
    return explicitId;
  }
  try {
    const raw = localStorage.getItem('daycare_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.staffId) return user.staffId;
    }
  } catch {
    // fallback
  }
  return null;
}

export const attendanceApi = {
  async record(dto: RecordAttendanceDto): Promise<Attendance> {
    const staffId = getValidStaffId(dto.recordedById);
    const payload: Record<string, unknown> = {
      childId: dto.childId,
      arrivalTime: dto.arrivalTime || new Date().toISOString(),
      exitTime: dto.exitTime || null,
      note: dto.note || '',
    };
    if (staffId) {
      payload.recordedById = staffId;
    }
    return apiClient.post<Attendance>('/api/attendance', payload);
  },

  async checkOut(dto: CheckOutAttendanceDto): Promise<Attendance> {
    const staffId = getValidStaffId(dto.recordedById);
    const payload: Record<string, unknown> = {
      childId: dto.childId,
      date: dto.date || new Date().toISOString().split('T')[0],
      exitTime: dto.exitTime || new Date().toISOString(),
      note: dto.note || null,
    };
    if (staffId) {
      payload.recordedById = staffId;
    }
    return apiClient.post<Attendance>('/api/attendance/checkout', payload);
  },

  async getDaily(date?: string): Promise<Attendance[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return apiClient.get<Attendance[]>('/api/attendance/daily', { date: targetDate });
  },

  async getByClassroom(classroomId: UUID, date?: string): Promise<Attendance[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return apiClient.get<Attendance[]>(`/api/attendance/classroom/${classroomId}`, {
      date: targetDate,
    });
  },

  async getByChild(childId: UUID): Promise<Attendance[]> {
    return apiClient.get<Attendance[]>(`/api/attendance/child/${childId}`);
  },
};
