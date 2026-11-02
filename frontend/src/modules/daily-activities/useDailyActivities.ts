import { useCallback, useEffect, useState } from 'react';
import { dailyActivitiesApi } from './dailyActivitiesApi';
import { dailyActivitiesStore } from './store';
import type { RecordActivityDto, UpdateActivityDto } from './types';

export function useDailyActivities(filterChildId = '') {
  const [state, setState] = useState(() => dailyActivitiesStore.getState());

  useEffect(() => {
    const unsubscribe = dailyActivitiesStore.subscribe(() => {
      setState(dailyActivitiesStore.getState());
    });

    dailyActivitiesStore.loadDaily();

    return unsubscribe;
  }, []);

  const refetch = useCallback(async (date?: string) => {
    return dailyActivitiesStore.loadDaily(date, true);
  }, []);

  const recordActivity = useCallback(
    async (dto: RecordActivityDto, _childName?: string, _staffName?: string) => {
      return dailyActivitiesStore.record(dto);
    },
    []
  );

  const updateActivity = useCallback(async (id: string, dto: UpdateActivityDto) => {
    return dailyActivitiesStore.update(id, dto);
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    return dailyActivitiesStore.delete(id);
  }, []);

  const getChildActivities = useCallback(async (childId: string) => {
    return dailyActivitiesApi.getByChild(childId);
  }, []);

  const filteredActivities = filterChildId
    ? state.activities.filter((a) => a.childId === filterChildId)
    : state.activities;

  return {
    activities: filteredActivities,
    allActivities: state.activities,
    totalCount: filteredActivities.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    recordActivity,
    updateActivity,
    deleteActivity,
    getChildActivities,
  };
}
