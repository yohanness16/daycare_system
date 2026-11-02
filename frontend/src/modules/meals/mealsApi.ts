import { apiClient } from '../../core/api/api-client';
import type { UUID } from '../../core/types/common';
import {
  mealStatusToNumber,
  mealStatusToString,
  mealTypeToNumber,
  mealTypeToString,
} from '../../core/types/enums';
import type { BackendMealResponse, Meal, RecordMealDto, UpdateMealDto } from './types';

function mapMeal(item: BackendMealResponse): Meal {
  return {
    id: item.id,
    childId: item.childId,
    childName: item.childName,
    staffId: item.staffId,
    staffName: item.staffName,
    type: mealTypeToString(item.type),
    food: item.food,
    mealTime: item.mealTime,
    status: mealStatusToString(item.status),
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

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

export const mealsApi = {
  async record(dto: RecordMealDto): Promise<Meal> {
    const staffId = getValidStaffId(dto.staffId);
    const payload: Record<string, unknown> = {
      childId: dto.childId,
      mealTime: dto.mealTime || new Date().toISOString(),
      type: mealTypeToNumber(dto.type),
      food: dto.food,
      status: mealStatusToNumber(dto.status),
      notes: dto.notes || '',
    };
    if (staffId) {
      payload.staffId = staffId;
    }
    const res = await apiClient.post<BackendMealResponse>('/api/meals', payload);
    return mapMeal(res);
  },

  async update(id: UUID, dto: UpdateMealDto): Promise<Meal> {
    const payload = {
      ...dto,
      mealTime: dto.mealTime || new Date().toISOString(),
      type: mealTypeToNumber(dto.type),
      status: mealStatusToNumber(dto.status),
      notes: dto.notes || '',
    };
    const res = await apiClient.put<BackendMealResponse>(`/api/meals/${id}`, payload);
    return mapMeal(res);
  },

  async delete(id: UUID): Promise<void> {
    return apiClient.delete<void>(`/api/meals/${id}`);
  },

  async getDaily(date?: string): Promise<Meal[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const list = await apiClient.get<BackendMealResponse[]>('/api/meals/daily', {
      date: targetDate,
    });
    return list.map(mapMeal);
  },

  async getByChild(childId: UUID): Promise<Meal[]> {
    const list = await apiClient.get<BackendMealResponse[]>(`/api/meals/child/${childId}`);
    return list.map(mapMeal);
  },
};
