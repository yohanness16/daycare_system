import { useCallback, useEffect, useState } from 'react';
import { mealsApi } from './mealsApi';
import { mealsStore } from './store';
import type { RecordMealDto, UpdateMealDto } from './types';

export function useMeals(filterChildId = '') {
  const [state, setState] = useState(() => mealsStore.getState());

  useEffect(() => {
    const unsubscribe = mealsStore.subscribe(() => {
      setState(mealsStore.getState());
    });

    mealsStore.loadDaily();

    return unsubscribe;
  }, []);

  const refetch = useCallback(async (date?: string) => {
    return mealsStore.loadDaily(date, true);
  }, []);

  const recordMeal = useCallback(
    async (dto: RecordMealDto, _childName?: string, _staffName?: string) => {
      return mealsStore.record(dto);
    },
    []
  );

  const updateMeal = useCallback(async (id: string, dto: UpdateMealDto) => {
    return mealsStore.update(id, dto);
  }, []);

  const deleteMeal = useCallback(async (id: string) => {
    return mealsStore.delete(id);
  }, []);

  const getChildMeals = useCallback(async (childId: string) => {
    return mealsApi.getByChild(childId);
  }, []);

  const filteredMeals = filterChildId
    ? state.meals.filter((m) => m.childId === filterChildId)
    : state.meals;

  return {
    meals: filteredMeals,
    allMeals: state.meals,
    totalCount: filteredMeals.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    recordMeal,
    updateMeal,
    deleteMeal,
    getChildMeals,
  };
}
