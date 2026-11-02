import { apiClient } from '../../core/api/api-client';
import type { Attendance } from '../attendance/types';
import type { Meal } from '../meals/types';
import type { DailyActivity } from '../daily-activities/types';

export interface ChildDailyConsolidated {
  childId: string;
  childName: string;
  classroomId?: string;
  classroomName?: string;
  attendanceStatus?: string;
  arrivalTime?: string;
  departureTime?: string;
  mood?: number;
  meals: Meal[];
  activities: DailyActivity[];
}

export interface ConsolidatedDailyReport {
  date: string;
  classroomId?: string;
  totalChildren: number;
  totalPresent: number;
  totalAbsent: number;
  totalMeals: number;
  totalActivities: number;
  attendance: Attendance[];
  meals: Meal[];
  activities: DailyActivity[];
  childrenReports: ChildDailyConsolidated[];
}

export const reportsApi = {
  /**
   * Fetches the consolidated daily report for any specified date.
   */
  async getDailyReport(date?: string, classroomId?: string): Promise<ConsolidatedDailyReport> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const params: Record<string, unknown> = { date: targetDate };
    if (classroomId) {
      params.classroomId = classroomId;
    }

    return apiClient.get<ConsolidatedDailyReport>('/api/reports/daily', params);
  },
};
