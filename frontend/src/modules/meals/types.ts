import type { UUID } from '../../core/types/common';
import type { MealStatus, MealType } from '../../core/types/enums';

export interface Meal {
  id: UUID;
  childId: UUID;
  childName: string;
  staffId: UUID;
  staffName: string;
  type: MealType;
  food: string;
  mealTime: string;
  status: MealStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendMealResponse {
  id: UUID;
  childId: UUID;
  childName: string;
  staffId: UUID;
  staffName: string;
  type: number | MealType;
  food: string;
  mealTime: string;
  status: number | MealStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordMealDto {
  childId: UUID;
  staffId?: UUID | null;
  type: MealType | number;
  food: string;
  mealTime?: string;
  status: MealStatus | number;
  notes?: string;
}

export interface UpdateMealDto {
  type: MealType | number;
  food: string;
  mealTime?: string;
  status: MealStatus | number;
  notes?: string;
  staffId?: UUID;
}
