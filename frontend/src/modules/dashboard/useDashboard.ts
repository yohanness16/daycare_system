import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityType, MealStatus, MealType } from '../../core/types/enums';
import { attendanceApi } from '../attendance/attendanceApi';
import { dailyActivitiesApi } from '../daily-activities/dailyActivitiesApi';
import { mealsApi } from '../meals/mealsApi';
import { dashboardService } from './dashboardService';
import type { DashboardData } from './types';

export interface UseDashboardOptions {
  initialDate?: string;
  autoRefreshIntervalMs?: number; // Optional polling interval (e.g. 30000ms)
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => options.initialDate || new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchDashboard = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const result = await dashboardService.getDashboardData(selectedDate);
        if (isMountedRef.current) {
          setData(result);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    isMountedRef.current = true;
    void fetchDashboard(false);

    let timer: number | undefined;
    if (options.autoRefreshIntervalMs && options.autoRefreshIntervalMs > 0) {
      timer = window.setInterval(() => {
        void fetchDashboard(true);
      }, options.autoRefreshIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (timer) clearInterval(timer);
    };
  }, [fetchDashboard, options.autoRefreshIntervalMs]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const refetch = useCallback(async () => {
    return fetchDashboard(true);
  }, [fetchDashboard]);

  // Quick Action Handlers
  const quickCheckIn = useCallback(
    async (childId: string, note?: string) => {
      await attendanceApi.record({
        childId,
        note,
        date: selectedDate,
        arrivalTime: new Date().toISOString(),
      });
      await refetch();
    },
    [refetch, selectedDate]
  );

  const quickCheckOut = useCallback(
    async (childId: string, note?: string) => {
      await attendanceApi.checkOut({
        childId,
        note,
        date: selectedDate,
        exitTime: new Date().toISOString(),
      });
      await refetch();
    },
    [refetch, selectedDate]
  );

  const quickLogMeal = useCallback(
    async (childId: string, staffId: string, type: MealType, food: string, status: MealStatus) => {
      await mealsApi.record({ childId, staffId, type, food, status });
      await refetch();
    },
    [refetch]
  );

  const quickLogActivity = useCallback(
    async (childId: string, activityType: ActivityType, activityDescription: string) => {
      await dailyActivitiesApi.record({ childId, activityType, activityDescription });
      await refetch();
    },
    [refetch]
  );

  return {
    selectedDate,
    setSelectedDate,
    goToToday,
    data,
    stats: data?.stats ?? null,
    classrooms: data?.classrooms ?? [],
    attendance: data?.attendance ?? null,
    meals: data?.meals ?? null,
    activities: data?.activities ?? null,
    eventTimeline: data?.eventTimeline ?? [],
    lastUpdated: data?.lastUpdated ?? null,
    isLoading,
    isRefreshing,
    error,
    refetch,
    quickCheckIn,
    quickCheckOut,
    quickLogMeal,
    quickLogActivity,
  };
}
