import type { UUID } from '../../core/types/common';
import type { ActivityType } from '../../core/types/enums';

export interface DailyActivity {
  id: UUID;
  childId: UUID;
  childName: string;
  activityType: ActivityType;
  startTime: string;
  endTime?: string | null;
  activityDescription: string;
  recordedById?: UUID | null;
  recordedByName?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendDailyActivityResponse {
  id: UUID;
  childId: UUID;
  childName: string;
  activityType: number | ActivityType;
  startTime: string;
  endTime?: string | null;
  activityDescription: string;
  recordedById?: UUID | null;
  recordedByName?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordActivityDto {
  childId: UUID;
  activityType: ActivityType | number;
  startTime?: string;
  endTime?: string | null;
  activityDescription: string;
  recordedById?: UUID;
  note?: string;
}

export interface UpdateActivityDto {
  activityType?: ActivityType | number;
  startTime?: string;
  endTime?: string | null;
  activityDescription?: string;
  note?: string;
  recordedById?: UUID;
}
