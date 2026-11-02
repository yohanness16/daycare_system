import type { UUID } from '../../core/types/common';
import type { ActivityType } from '../../core/types/enums';
import type { Attendance } from '../attendance/types';
import type { DailyActivity } from '../daily-activities/types';
import type { Meal } from '../meals/types';

export interface DashboardStats {
  totalChildren: number;
  totalGuardians: number;
  totalClassrooms: number;
  totalStaff: number;
  presentTodayCount: number;
  checkedOutTodayCount: number;
  absentTodayCount: number;
  attendanceRate: number; // percentage (0..100)
  activeEnrollmentsCount: number;
  totalClassroomCapacity: number;
  overallOccupancyPercentage: number; // percentage (0..100)
  mealsLoggedTodayCount: number;
  activitiesLoggedTodayCount: number;
  alertCount: number; // e.g. sick children, over-capacity rooms
}

export interface ClassroomDashboardItem {
  id: UUID;
  name: string;
  capacity: number;
  enrolledCount: number;
  occupancyRate: number; // percentage
  presentCount: number;
  assignedStaff: {
    id: UUID;
    name: string;
    role: string;
  }[];
  staffToChildRatio: string; // e.g. "1:4" or "N/A"
  status: 'Underenrolled' | 'Normal' | 'Near Capacity' | 'At Capacity' | 'Over Capacity';
}

export interface AttendanceOverview {
  totalExpected: number;
  presentCount: number;
  checkedOutCount: number;
  absentCount: number;
  attendanceRate: number;
  recentCheckIns: Attendance[];
  recentCheckOuts: Attendance[];
  stillPresentList: Attendance[];
  unrecordedChildren: {
    id: UUID;
    name: string;
    classroomName?: string;
  }[];
}

export interface MealDashboardSummary {
  totalLogged: number;
  byType: {
    Breakfast: number;
    Lunch: number;
    Snack: number;
    Dinner: number;
    Other: number;
  };
  byStatus: {
    Eaten: number;
    PartiallyEaten: number;
    NotEaten: number;
  };
  uneatenAlerts: Meal[];
  recentMeals: Meal[];
}

export interface ActivityDashboardSummary {
  totalLogged: number;
  byType: Record<ActivityType, number>;
  healthAlerts: DailyActivity[]; // ill / incident
  recentActivities: DailyActivity[];
}

export type DashboardEventCategory = 'attendance' | 'meal' | 'activity' | 'enrollment';
export type DashboardEventSeverity = 'info' | 'success' | 'warning' | 'alert';

export interface DashboardEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  category: DashboardEventCategory;
  severity: DashboardEventSeverity;
  title: string;
  subtitle: string;
  childId?: UUID;
  childName?: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardData {
  date: string;
  stats: DashboardStats;
  classrooms: ClassroomDashboardItem[];
  attendance: AttendanceOverview;
  meals: MealDashboardSummary;
  activities: ActivityDashboardSummary;
  eventTimeline: DashboardEvent[];
  lastUpdated: string;
}
