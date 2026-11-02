import { useCallback, useEffect, useState } from 'react';
import { classroomsStore } from './store';
import type {
  AssignStaffToClassroomDto,
  CreateClassroomDto,
  UpdateClassroomDto,
} from './types';

export function useClassrooms() {
  const [state, setState] = useState(() => classroomsStore.getState());

  useEffect(() => {
    const unsubscribe = classroomsStore.subscribe(() => {
      setState(classroomsStore.getState());
    });

    if (!classroomsStore.getState().isLoaded) {
      classroomsStore.load();
    }

    return unsubscribe;
  }, []);

  const refetch = useCallback(async () => {
    return classroomsStore.load(true);
  }, []);

  const getClassroomById = useCallback((id: string) => classroomsStore.getById(id), []);

  const fetchClassroomById = useCallback(async (id: string) => {
    return classroomsStore.fetchById(id);
  }, []);

  const createClassroom = useCallback(async (dto: CreateClassroomDto) => {
    return classroomsStore.create(dto);
  }, []);

  const updateClassroom = useCallback(async (id: string, dto: UpdateClassroomDto) => {
    return classroomsStore.update(id, dto);
  }, []);

  const deleteClassroom = useCallback(async (id: string) => {
    return classroomsStore.delete(id);
  }, []);

  const loadStaffForClassroom = useCallback(async (classroomId: string, activeOnly = true) => {
    return classroomsStore.loadStaffForClassroom(classroomId, activeOnly);
  }, []);

  const getStaffForClassroom = useCallback((classroomId: string) => {
    return classroomsStore.getStaffForClassroom(classroomId);
  }, []);

  const assignStaff = useCallback(async (dto: AssignStaffToClassroomDto) => {
    return classroomsStore.assignStaff(dto);
  }, []);

  const removeStaffAssignment = useCallback(async (classroomId: string, assignmentId: string) => {
    return classroomsStore.removeStaffAssignment(classroomId, assignmentId);
  }, []);

  return {
    classrooms: state.classrooms,
    totalCount: state.classrooms.length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    getClassroomById,
    fetchClassroomById,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    loadStaffForClassroom,
    getStaffForClassroom,
    assignStaff,
    removeStaffAssignment,
  };
}
