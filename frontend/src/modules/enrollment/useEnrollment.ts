import { useCallback, useEffect, useState } from 'react';
import { enrollmentStore } from './store';
import type {
  EnrollChildDto,
  EnrollmentFilterOptions,
  TransferChildClassroomDto,
} from './types';

export function useEnrollment(filters?: EnrollmentFilterOptions) {
  const [state, setState] = useState(() => enrollmentStore.getState());

  useEffect(() => {
    const unsubscribe = enrollmentStore.subscribe(() => {
      setState(enrollmentStore.getState());
    });

    if (!enrollmentStore.getState().isLoaded) {
      enrollmentStore.load(filters);
    }

    return unsubscribe;
  }, [filters]);

  const refetch = useCallback(async (customFilters?: EnrollmentFilterOptions) => {
    return enrollmentStore.load(customFilters ?? filters, true);
  }, [filters]);

  const enrollChild = useCallback(
    async (dto: EnrollChildDto, _childName?: string, _classroomName?: string) => {
      return enrollmentStore.enroll(dto);
    },
    []
  );

  const transferChild = useCallback(
    async (dto: TransferChildClassroomDto, _newClassroomName?: string) => {
      return enrollmentStore.transfer(dto);
    },
    []
  );

  const endEnrollment = useCallback(async (id: string) => {
    return enrollmentStore.endEnrollment(id);
  }, []);

  const getEnrollmentsByClassroom = useCallback((classroomId: string) => {
    return enrollmentStore.getByClassroom(classroomId);
  }, []);

  const getEnrollmentsByChild = useCallback((childId: string) => {
    return enrollmentStore.getByChild(childId);
  }, []);

  return {
    enrollments: state.enrollments,
    totalCount: state.enrollments.length,
    activeCount: state.enrollments.filter((e) => e.status === 'Active').length,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    enrollChild,
    transferChild,
    endEnrollment,
    getEnrollmentsByClassroom,
    getEnrollmentsByChild,
  };
}
