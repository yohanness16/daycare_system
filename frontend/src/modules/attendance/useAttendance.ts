import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from './attendanceApi';
import { attendanceStore } from './store';
import type { CheckOutAttendanceDto, RecordAttendanceDto } from './types';

export function useAttendance(filterDate = '') {
  const [state, setState] = useState(() => attendanceStore.getState());
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const activeDate = filterDate || today;

  useEffect(() => {
    const unsubscribe = attendanceStore.subscribe(() => {
      setState(attendanceStore.getState());
    });

    attendanceStore.loadDaily(activeDate);

    return unsubscribe;
  }, [activeDate]);

  const refetch = useCallback(async (date?: string) => {
    return attendanceStore.loadDaily(date || activeDate, true);
  }, [activeDate]);

  const checkIn = useCallback(
    async (dto: RecordAttendanceDto, _childName?: string, _recordedByName?: string) => {
      return attendanceStore.checkIn(dto);
    },
    []
  );

  const checkOut = useCallback(async (dto: CheckOutAttendanceDto) => {
    return attendanceStore.checkOut(dto);
  }, []);

  const getChildAttendance = useCallback((childId: string) => {
    return attendanceStore.getByChild(childId);
  }, []);

  const fetchChildAttendance = useCallback(async (childId: string) => {
    return attendanceStore.loadChildAttendance(childId);
  }, []);

  const getClassroomAttendance = useCallback(async (classroomId: string, date?: string) => {
    return attendanceApi.getByClassroom(classroomId, date || activeDate);
  }, [activeDate]);

  const dailyRecords = state.records.filter((r) => r.date === activeDate);
  const presentCount = dailyRecords.filter((r) => r.isPresent && !r.departureTime).length;
  const checkedOutCount = dailyRecords.filter((r) => !!r.departureTime).length;

  return {
    records: dailyRecords,
    allRecords: state.records,
    totalRecords: dailyRecords.length,
    presentCount,
    checkedOutCount,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    checkIn,
    checkOut,
    getChildAttendance,
    fetchChildAttendance,
    getClassroomAttendance,
  };
}
