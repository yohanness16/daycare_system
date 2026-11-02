import { useCallback, useEffect, useState } from 'react';
import { childrenStore } from './store';
import type { RegisterChildDto, UpdateChildDto } from './types';

export function useChildren(searchQuery = '') {
  const [state, setState] = useState(() => childrenStore.getState());

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = childrenStore.subscribe(() => {
      setState(childrenStore.getState());
    });

    // Automatically load children if not loaded yet
    if (!childrenStore.getState().isLoaded) {
      childrenStore.load();
    }

    return unsubscribe;
  }, []);

  const refetch = useCallback(async () => {
    return childrenStore.load(true);
  }, []);

  const filteredChildren = state.children.filter((child) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      child.firstName?.toLowerCase().includes(query) ||
      child.lastName?.toLowerCase().includes(query) ||
      child.guardianName?.toLowerCase().includes(query)
    );
  });

  const getChildById = useCallback((id: string) => childrenStore.getById(id), []);

  const fetchChildById = useCallback(async (id: string) => {
    return childrenStore.fetchById(id);
  }, []);

  const registerChild = useCallback(async (dto: RegisterChildDto, _guardianName?: string) => {
    return childrenStore.register(dto);
  }, []);

  const updateChild = useCallback(async (id: string, dto: UpdateChildDto, _guardianName?: string) => {
    return childrenStore.update(id, dto);
  }, []);

  const deleteChild = useCallback(async (id: string) => {
    return childrenStore.delete(id);
  }, []);

  const updatePhoto = useCallback(async (id: string, photoUrl: string) => {
    return childrenStore.updatePhoto(id, photoUrl);
  }, []);

  return {
    children: filteredChildren,
    rawChildren: state.children,
    totalCount: filteredChildren.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    getChildById,
    fetchChildById,
    registerChild,
    updateChild,
    deleteChild,
    updatePhoto,
  };
}
