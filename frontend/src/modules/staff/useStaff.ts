import { useCallback, useEffect, useState } from 'react';
import { staffApi } from './staffApi';
import { staffStore } from './store';
import type { CreateStaffDto, UpdateStaffDto } from './types';

export function useStaff(
  roleFilter = '',
  statusFilter: 'all' | 'active' | 'inactive' = 'all'
) {
  const [state, setState] = useState(() => staffStore.getState());

  useEffect(() => {
    const unsubscribe = staffStore.subscribe(() => {
      setState(staffStore.getState());
    });

    if (!staffStore.getState().isLoaded) {
      staffStore.load();
    }

    return unsubscribe;
  }, []);

  const refetch = useCallback(async () => {
    return staffStore.load(true);
  }, []);

  const filteredStaff = state.staff.filter((s) => {
    if (roleFilter && s.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (statusFilter === 'active' && s.isActive === false) return false;
    if (statusFilter === 'inactive' && s.isActive !== false) return false;
    return true;
  });

  const getStaffById = useCallback((id: string) => staffStore.getById(id), []);

  const fetchStaffById = useCallback(async (id: string) => {
    return staffStore.fetchById(id);
  }, []);

  const createStaff = useCallback(async (dto: CreateStaffDto) => {
    return staffStore.create(dto);
  }, []);

  const updateStaff = useCallback(async (id: string, dto: UpdateStaffDto) => {
    return staffStore.update(id, dto);
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    return staffStore.delete(id);
  }, []);

  const deactivateStaff = useCallback(async (id: string) => {
    return staffStore.deactivate(id);
  }, []);

  const reactivateStaff = useCallback(async (id: string) => {
    return staffStore.reactivate(id);
  }, []);

  const resetStaffPassword = useCallback(async (id: string) => {
    return staffApi.resetPassword(id);
  }, []);

  const getStaffDependents = useCallback(async (id: string) => {
    return staffApi.getDependents(id);
  }, []);

  const updatePhoto = useCallback(async (id: string, photoUrl: string) => {
    return staffStore.updatePhoto(id, photoUrl);
  }, []);

  return {
    staff: filteredStaff,
    rawStaff: state.staff,
    totalCount: filteredStaff.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    getStaffById,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    deactivateStaff,
    reactivateStaff,
    resetStaffPassword,
    getStaffDependents,
    updatePhoto,
  };
}
