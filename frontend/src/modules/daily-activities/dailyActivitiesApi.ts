import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import { activityTypeToNumber, activityTypeToString } from '../../core/types/enums';
import type {
  BackendDailyActivityResponse,
  DailyActivity,
  RecordActivityDto,
  UpdateActivityDto,
} from './types';

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

function mapActivity(item: BackendDailyActivityResponse): DailyActivity {
  return {
    id: item.id,
    childId: item.childId,
    childName: item.childName,
    activityType: activityTypeToString(item.activityType),
    startTime: item.startTime,
    endTime: item.endTime,
    activityDescription: item.activityDescription,
    recordedById: item.recordedById,
    recordedByName: item.recordedByName,
    note: item.note,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const dailyActivitiesApi = {
  async record(dto: RecordActivityDto): Promise<DailyActivity> {
    const staffId = getValidStaffId(dto.recordedById);
    const payload: Record<string, unknown> = {
      childId: dto.childId,
      activityType: activityTypeToNumber(dto.activityType),
      startTime: dto.startTime || new Date().toISOString(),
      endTime: dto.endTime || null,
      activityDescription: dto.activityDescription || '',
      note: dto.note || '',
    };
    if (staffId) {
      payload.recordedById = staffId;
    }
    const res = await apiClient.post<BackendDailyActivityResponse>('/api/dailyactivities', payload);
    return mapActivity(res);
  },

  async update(id: UUID, dto: UpdateActivityDto): Promise<DailyActivity> {
    const staffId = getValidStaffId(dto.recordedById);
    const payload: Record<string, unknown> = {
      startTime: dto.startTime || new Date().toISOString(),
      endTime: dto.endTime !== undefined ? dto.endTime : null,
      activityType: dto.activityType !== undefined ? activityTypeToNumber(dto.activityType) : 0,
      activityDescription: dto.activityDescription || '',
      note: dto.note || '',
    };
    if (staffId) {
      payload.recordedById = staffId;
    }
    const res = await apiClient.put<BackendDailyActivityResponse>(
      `/api/dailyactivities/${id}`,
      payload
    );
    return mapActivity(res);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/dailyactivities/${id}`);
  },

  async getDaily(date?: string): Promise<DailyActivity[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const list = await apiClient.get<BackendDailyActivityResponse[]>('/api/dailyactivities/daily', {
      date: targetDate,
    });
    return list.map(mapActivity);
  },

  async getByChild(childId: UUID): Promise<DailyActivity[]> {
    const list = await apiClient.get<BackendDailyActivityResponse[]>(
      `/api/dailyactivities/child/${childId}`
    );
    return list.map(mapActivity);
  },
};
