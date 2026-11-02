import { useCallback, useEffect, useState } from 'react';
import { guardiansStore } from './store';
import type { CreateGuardianDto, UpdateGuardianDto } from './types';

export function useGuardians(searchQuery = '') {
  const [state, setState] = useState(() => guardiansStore.getState());

  useEffect(() => {
    const unsubscribe = guardiansStore.subscribe(() => {
      setState(guardiansStore.getState());
    });

    if (!guardiansStore.getState().isLoaded) {
      guardiansStore.load();
    }

    return unsubscribe;
  }, []);

  const refetch = useCallback(async (query?: string) => {
    return guardiansStore.load(query, true);
  }, []);

  const filteredGuardians = state.guardians.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.firstName?.toLowerCase().includes(q) ||
      g.lastName?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.email?.toLowerCase().includes(q)
    );
  });

  const getGuardianById = useCallback((id: string) => guardiansStore.getById(id), []);

  const fetchGuardianById = useCallback(async (id: string) => {
    return guardiansStore.fetchById(id);
  }, []);

  const createGuardian = useCallback(async (dto: CreateGuardianDto) => {
    return guardiansStore.create(dto);
  }, []);

  const updateGuardian = useCallback(async (id: string, dto: UpdateGuardianDto) => {
    return guardiansStore.update(id, dto);
  }, []);

  const deleteGuardian = useCallback(async (id: string) => {
    return guardiansStore.delete(id);
  }, []);

  const updatePhoto = useCallback(async (id: string, photoUrl: string) => {
    return guardiansStore.updatePhoto(id, photoUrl);
  }, []);

  return {
    guardians: filteredGuardians,
    rawGuardians: state.guardians,
    totalCount: filteredGuardians.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    getGuardianById,
    fetchGuardianById,
    createGuardian,
    updateGuardian,
    deleteGuardian,
    updatePhoto,
  };
}
