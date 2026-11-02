import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  ActivityType,
  MealStatus,
  MealType,
} from '../../../core/types/enums';
import {
  formatAge,
  formatTimeDisplay,
  getTodayLocalDateString,
} from '../../../core/utils/dateUtils';
import { AllergyBadge, Avatar, Badge, Button, Drawer, Modal, SearchField } from '../../../components/ui';
import { useAttendance } from '../useAttendance';
import { useChildren } from '../../children/useChildren';
import type { Child } from '../../children/types';
import { useClassrooms } from '../../classrooms/useClassrooms';
import { useEnrollment } from '../../enrollment/useEnrollment';
import { useGuardians } from '../../guardians/useGuardians';
import { mealsApi } from '../../meals/mealsApi';
import type { Meal } from '../../meals/types';
import { dailyActivitiesApi } from '../../daily-activities/dailyActivitiesApi';
import type { DailyActivity } from '../../daily-activities/types';

// Activity category definitions per spec §5.1
const ACTIVITY_CATEGORIES: { type: ActivityType; label: string; icon: string; color: string }[] = [
  { type: ActivityType.Learning, label: 'Learning', icon: 'school', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { type: ActivityType.Play, label: 'Play', icon: 'smart_toy', color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
  { type: ActivityType.Nap, label: 'Nap / Rest', icon: 'bedtime', color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { type: ActivityType.Outdoor, label: 'Outdoor', icon: 'forest', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { type: ActivityType.Art, label: 'Art & Craft', icon: 'palette', color: 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
  { type: ActivityType.Music, label: 'Music', icon: 'music_note', color: 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
  { type: ActivityType.Eating, label: 'Snack / Eat', icon: 'lunch_dining', color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { type: ActivityType.Ill, label: 'Health / Ill', icon: 'medical_services', color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  { type: ActivityType.Other, label: 'Other', icon: 'more_horiz', color: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

export const TodayBoardPage: React.FC = () => {
  const { user } = useAuth();

  // Date Navigator state (defaults to center's local date)
  const todayStr = useMemo(() => getTodayLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_arrived' | 'present' | 'checked_out'>('all');

  // Drawer & Modals state
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check-In Modal state
  const [checkInTarget, setCheckInTarget] = useState<Child | null>(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Check-Out Modal state
  const [checkOutTarget, setCheckOutTarget] = useState<Child | null>(null);
  const [checkOutTime, setCheckOutTime] = useState('');
  const [checkOutNote, setCheckOutNote] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);

  // Quick Meal Modal state
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealTargetChild, setMealTargetChild] = useState<Child | null>(null);
  const [mealType, setMealType] = useState<MealType>(MealType.Lunch);
  const [mealFood, setMealFood] = useState('');
  const [mealStatus, setMealStatus] = useState<MealStatus>(MealStatus.Eaten);
  const [mealNotes, setMealNotes] = useState('');
  const [isSavingMeal, setIsSavingMeal] = useState(false);

  // Quick Activity Modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityTargetChild, setActivityTargetChild] = useState<Child | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Play);
  const [activityDescription, setActivityDescription] = useState('');
  const [activityStartTime, setActivityStartTime] = useState('');
  const [activityEndTime, setActivityEndTime] = useState('');
  const [activityNote, setActivityNote] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [timerMode, setTimerMode] = useState(false);

  // Data fetching hooks
  const { records, checkIn, checkOut, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendance(selectedDate);
  const { children, isLoading: childrenLoading } = useChildren();
  const { classrooms } = useClassrooms();
  const { enrollments } = useEnrollment();
  const { getGuardianById } = useGuardians();

  // Child specific live timeline records for Child Quick Panel
  const [childMeals, setChildMeals] = useState<Meal[]>([]);
  const [childActivities, setChildActivities] = useState<DailyActivity[]>([]);
  const [childPanelLoading, setChildPanelLoading] = useState(false);

  // Auto detect default meal type based on current hour per spec §8.5
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setMealType(MealType.Breakfast);
    else if (hour < 11.5) setMealType(MealType.Snack);
    else if (hour < 14) setMealType(MealType.Lunch);
    else if (hour < 17) setMealType(MealType.Snack);
    else setMealType(MealType.Dinner);
  }, [isMealModalOpen]);

  // Attendance lookup Map
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof records)[0]>();
    records.forEach((r) => map.set(r.childId, r));
    return map;
  }, [records]);

  // Enrollment classroom lookup
  const childClassroomMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    enrollments.forEach((e) => {
      // Active enrollment status is 'Active'
      const isAct = e.status === 'Active';
      if (isAct && e.classroomId) {
        map.set(e.childId, {
          id: e.classroomId,
          name: e.classroomName || 'Enrolled Room',
        });
      }
    });
    return map;
  }, [enrollments]);

  const activeGuardian = activeChild ? getGuardianById(activeChild.guardianId) : null;
  const activeClassroom = activeChild ? childClassroomMap.get(activeChild.id) : null;

  // Merge children with today's status
  const mergedChildrenList = useMemo(() => {
    return children.map((child) => {
      const att = attendanceMap.get(child.id);
      const room = childClassroomMap.get(child.id);

      let status: 'not_arrived' | 'present' | 'checked_out' = 'not_arrived';
      let arrivalTimeFormatted = '';
      let departureTimeFormatted = '';

      if (att && att.isPresent) {
        if (att.departureTime) {
          status = 'checked_out';
          departureTimeFormatted = formatTimeDisplay(att.departureTime);
        } else {
          status = 'present';
          arrivalTimeFormatted = formatTimeDisplay(att.arrivalTime ?? undefined);
        }
      }

      return {
        ...child,
        status,
        classroomName: room?.name || 'Unassigned',
        classroomId: room?.id || '',
        arrivalTimeFormatted,
        departureTimeFormatted,
        attendanceRecord: att,
      };
    });
  }, [children, attendanceMap, childClassroomMap]);

  // Filtered children list
  const filteredList = useMemo(() => {
    return mergedChildrenList.filter((c) => {
      // Classroom filter
      if (selectedClassroomId !== 'all' && c.classroomId !== selectedClassroomId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const guardian = (c.guardianName || '').toLowerCase();
        if (!fullName.includes(query) && !guardian.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [mergedChildrenList, selectedClassroomId, statusFilter, searchQuery]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    let present = 0;
    let notArrived = 0;
    let checkedOut = 0;

    mergedChildrenList.forEach((c) => {
      if (c.status === 'present') present++;
      else if (c.status === 'checked_out') checkedOut++;
      else notArrived++;
    });

    return { present, notArrived, checkedOut, total: mergedChildrenList.length };
  }, [mergedChildrenList]);

  // Fetch child's details for Quick Panel Drawer
  const openChildDrawer = async (child: Child) => {
    setActiveChild(child);
    setIsDrawerOpen(true);
    setChildPanelLoading(true);

    try {
      const [meals, acts] = await Promise.all([
        mealsApi.getByChild(child.id),
        dailyActivitiesApi.getByChild(child.id),
      ]);
      // Filter for selected date
      setChildMeals(meals.filter((m) => m.mealTime?.startsWith(selectedDate)));
      setChildActivities(acts.filter((a) => a.startTime?.startsWith(selectedDate)));
    } catch {
      // Ignore
    } finally {
      setChildPanelLoading(false);
    }
  };

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  // Open Check In Modal
  const handleOpenCheckIn = (child: Child, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const now = new Date();
    setCheckInTarget(child);
    setCheckInTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setCheckInNote('');
    setCheckInError(null);
  };

  // Submit Check In (≤ 2 taps)
  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTarget) return;

    try {
      setIsCheckingIn(true);
      setCheckInError(null);
      const currentNow = new Date();
      let arrivalTime: string;

      if (selectedDate === todayStr) {
        const [hrs, mins] = checkInTime ? checkInTime.split(':').map(Number) : [currentNow.getHours(), currentNow.getMinutes()];
        if (hrs === currentNow.getHours() && mins === currentNow.getMinutes()) {
          arrivalTime = currentNow.toISOString();
        } else {
          const [y, m, d] = selectedDate.split('-').map(Number);
          const dt = new Date(y, m - 1, d, hrs, mins, 0, 0);
          arrivalTime = dt.toISOString();
        }
      } else {
        const [hrs, mins] = checkInTime ? checkInTime.split(':').map(Number) : [currentNow.getHours(), currentNow.getMinutes()];
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d, hrs, mins, 0, 0);
        arrivalTime = dt.toISOString();
      }

      await checkIn(
        {
          childId: checkInTarget.id,
          date: selectedDate,
          arrivalTime,
          note: checkInNote || 'Arrival check-in',
        },
        `${checkInTarget.firstName} ${checkInTarget.lastName}`
      );

      setCheckInTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record check-in';
      setCheckInError(msg);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Open Check Out Modal
  const handleOpenCheckOut = (child: Child, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const now = new Date();
    setCheckOutTarget(child);
    setCheckOutTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setCheckOutNote('');
    setCheckOutError(null);
  };

  // Submit Check Out
  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutTarget) return;

    try {
      setIsCheckingOut(true);
      setCheckOutError(null);
      const currentNow = new Date();
      let exitDate: Date;
      const targetAtt = attendanceMap.get(checkOutTarget.id);
      const arrDate = targetAtt?.arrivalTime ? new Date(targetAtt.arrivalTime) : null;

      if (selectedDate === todayStr) {
        const [hrs, mins] = checkOutTime ? checkOutTime.split(':').map(Number) : [currentNow.getHours(), currentNow.getMinutes()];
        if (hrs === currentNow.getHours() && mins === currentNow.getMinutes()) {
          exitDate = currentNow;
        } else {
          const [y, m, d] = selectedDate.split('-').map(Number);
          exitDate = new Date(y, m - 1, d, hrs, mins, 0, 0);
        }
      } else {
        const [hrs, mins] = checkOutTime ? checkOutTime.split(':').map(Number) : [currentNow.getHours(), currentNow.getMinutes()];
        const [y, m, d] = selectedDate.split('-').map(Number);
        exitDate = new Date(y, m - 1, d, hrs, mins, 0, 0);
      }

      // Safeguard against departure being earlier than arrival time
      if (arrDate && exitDate.getTime() <= arrDate.getTime()) {
        // If checking out same-day or close in time, auto adjust departure to at least 2s after arrival
        if (Math.abs(exitDate.getTime() - arrDate.getTime()) < 3600000) {
          exitDate = new Date(arrDate.getTime() + 2000);
        } else {
          setCheckOutError(
            `Departure time cannot be earlier than arrival time (${formatTimeDisplay(arrDate.toISOString())}).`
          );
          setIsCheckingOut(false);
          return;
        }
      }

      await checkOut({
        childId: checkOutTarget.id,
        date: selectedDate,
        exitTime: exitDate.toISOString(),
        note: checkOutNote || 'Departure check-out',
      });

      setCheckOutTarget(null);
    } catch (err) {
      setCheckOutError(err instanceof Error ? err.message : 'Failed to check out');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Open Quick Meal Modal
  const handleOpenMealModal = (child: Child) => {
    setMealTargetChild(child);
    setMealFood('');
    setMealNotes('');
    setMealStatus(MealStatus.Eaten);
    setIsMealModalOpen(true);
  };

  // Save Meal
  const handleSaveMeal = async (saveAndAddAnother = false) => {
    if (!mealTargetChild || !mealFood.trim()) return;

    try {
      setIsSavingMeal(true);
      await mealsApi.record({
        childId: mealTargetChild.id,
        type: mealType,
        food: mealFood.trim(),
        mealTime: new Date().toISOString(),
        status: mealStatus,
        notes: mealNotes.trim(),
        staffId: user?.staffId,
      });

      if (activeChild?.id === mealTargetChild.id) {
        openChildDrawer(mealTargetChild);
      }

      if (saveAndAddAnother) {
        setMealFood('');
        setMealNotes('');
        // Keep child open or switch to next
      } else {
        setIsMealModalOpen(false);
        setMealTargetChild(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setIsSavingMeal(false);
    }
  };

  // Open Quick Activity Modal
  const handleOpenActivityModal = (child: Child) => {
    setActivityTargetChild(child);
    setActivityType(ActivityType.Play);
    setActivityDescription('Outdoor playground games');
    setActivityStartTime(new Date().toTimeString().slice(0, 5));
    setActivityEndTime('');
    setActivityNote('');
    setTimerMode(false);
    setIsActivityModalOpen(true);
  };

  // Save Activity
  const handleSaveActivity = async () => {
    if (!activityTargetChild) return;

    try {
      setIsSavingActivity(true);
      const now = new Date();
      const [hrs, mins] = activityStartTime ? activityStartTime.split(':') : [now.getHours(), now.getMinutes()];
      now.setHours(Number(hrs), Number(mins), 0);

      let endIso: string | undefined = undefined;
      if (activityEndTime && !timerMode) {
        const end = new Date();
        const [eHrs, eMins] = activityEndTime.split(':');
        end.setHours(Number(eHrs), Number(eMins), 0);
        endIso = end.toISOString();
      }

      await dailyActivitiesApi.record({
        childId: activityTargetChild.id,
        activityType,
        activityDescription: activityDescription.trim() || activityType,
        startTime: now.toISOString(),
        endTime: endIso,
        note: activityNote.trim(),
        recordedById: user?.staffId || undefined,
      });

      if (activeChild?.id === activityTargetChild.id) {
        openChildDrawer(activityTargetChild);
      }

      setIsActivityModalOpen(false);
      setActivityTargetChild(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save activity');
    } finally {
      setIsSavingActivity(false);
    }
  };

  // Preset food choices
  const QUICK_FOODS = ['Oatmeal & 1% Milk', 'Apple Slices & Cheese', 'Warm Rice & Veggies', 'Fruit Bowl & Pancakes', 'Turkey Sandwich'];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header & Operational Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Today Board
            </h1>
            <Badge variant="primary" label="Staff Primary" size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time daily operations: One-tap check-in/out, meal logs, and activity telemetry
          </p>
        </div>

        {/* Date Navigator & Classroom Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Classroom Selector */}
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date Navigator */}
          <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous day"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <span className="px-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {selectedDate === todayStr ? 'Today' : selectedDate}
            </span>

            <button
              type="button"
              onClick={handleNextDay}
              title="Next day"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={handleGoToday}
                className="ml-1 px-2 py-1 text-[11px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/50 rounded-md hover:bg-primary-100 transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="md"
            icon="sync"
            onClick={() => refetchAttendance()}
            title="Refresh attendance records"
          />
        </div>
      </div>

      {/* Summary Chips Strip & Filter Tabs per spec §8.4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Children ({summaryCounts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'present'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>Present ({summaryCounts.present})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('not_arrived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'not_arrived'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Not Arrived ({summaryCounts.notArrived})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('checked_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'checked_out'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span>Checked Out ({summaryCounts.checkedOut})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="w-full sm:w-64">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Filter child or parent..."
          />
        </div>
      </div>

      {/* Children Cards Grid (2-4 per row on tablet/desktop per spec §8.4) */}
      {attendanceLoading || childrenLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <span className="material-symbols-outlined text-[24px]">child_care</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No children match your filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try switching classroom or clearing your search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map((child) => {
            const ageText = formatAge(child.dateOfBirth);

            return (
              <div
                key={child.id}
                onClick={() => openChildDrawer(child)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-primary-500/30 transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between gap-4 cursor-pointer"
              >
                {/* Child Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${child.firstName} ${child.lastName}`}
                        id={child.id}
                        size="md"
                        status={
                          child.status === 'present'
                            ? 'present'
                            : child.status === 'checked_out'
                            ? 'departed'
                            : 'absent'
                        }
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {child.firstName} {child.lastName}
                          </h3>
                          <AllergyBadge
                            allergies={child.allergies}
                            childName={`${child.firstName} ${child.lastName}`}
                            size="sm"
                            dietaryRestrictions={child.dietaryRestrictions}
                            medicalNotes={child.medicalNotes}
                            medications={child.medications}
                            bloodType={child.bloodType}
                            pediatricianName={child.pediatricianName}
                            pediatricianPhone={child.pediatricianPhone}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {ageText} • {child.classroomName}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {child.status === 'present' && (
                      <Badge
                        variant="success"
                        icon="check"
                        label={`In: ${child.arrivalTimeFormatted || 'Present'}`}
                        size="sm"
                      />
                    )}
                    {child.status === 'not_arrived' && (
                      <Badge variant="warning" icon="schedule" label="Not Arrived" size="sm" />
                    )}
                    {child.status === 'checked_out' && (
                      <Badge
                        variant="neutral"
                        icon="logout"
                        label={`Out: ${child.departureTimeFormatted || 'Departed'}`}
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Primary Action Button (XL size 56px touch target per spec §6.1 & §8.4) */}
                <div onClick={(e) => e.stopPropagation()}>
                  {child.status === 'not_arrived' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="xl"
                      icon="how_to_reg"
                      onClick={(e) => handleOpenCheckIn(child, e)}
                      className="w-full shadow-sm text-sm"
                    >
                      Check In {child.firstName}
                    </Button>
                  )}

                  {child.status === 'present' && (
                    <Button
                      type="button"
                      variant="danger"
                      size="xl"
                      icon="logout"
                      onClick={(e) => handleOpenCheckOut(child, e)}
                      className="w-full shadow-sm text-sm"
                    >
                      Check Out
                    </Button>
                  )}

                  {child.status === 'checked_out' && (
                    <div className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">done_all</span>
                        <span>Departed today</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {child.departureTimeFormatted}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child Quick Panel (Slide-over drawer on tablet/desktop per spec §8.4) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width="md"
        title={
          activeChild && (
            <div className="flex items-center gap-3">
              <Avatar
                name={`${activeChild.firstName} ${activeChild.lastName}`}
                id={activeChild.id}
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeChild.firstName} {activeChild.lastName}
                  </h3>
                  <AllergyBadge
                    allergies={activeChild.allergies}
                    childName={`${activeChild.firstName} ${activeChild.lastName}`}
                    size="sm"
                    dietaryRestrictions={activeChild.dietaryRestrictions}
                    medicalNotes={activeChild.medicalNotes}
                    medications={activeChild.medications}
                    bloodType={activeChild.bloodType}
                    pediatricianName={activeChild.pediatricianName}
                    pediatricianPhone={activeChild.pediatricianPhone}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatAge(activeChild.dateOfBirth)} • {activeClassroom?.name || 'Enrolled'}
                </p>
              </div>
            </div>
          )
        }
      >
        {activeChild && (
          <div className="flex flex-col gap-5">
            {/* Guardian & Call Button */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Primary Guardian
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeGuardian ? `${activeGuardian.firstName} ${activeGuardian.lastName}` : activeChild.guardianName || 'Guardian Contact'}
                </p>
              </div>

              {activeGuardian?.phone ? (
                <a
                  href={`tel:${activeGuardian.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Call Guardian</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 italic">No phone listed</span>
              )}
            </div>

            {/* Quick Logging Action Buttons Bar per spec §8.4 */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Quick Log Actions
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  icon="lunch_dining"
                  onClick={() => handleOpenMealModal(activeChild)}
                  className="font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                >
                  Log Meal
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  icon="palette"
                  onClick={() => handleOpenActivityModal(activeChild)}
                  className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  Log Activity
                </Button>
              </div>
            </div>

            {/* Live Mini-Timeline of Today per spec §8.4 & §8.10 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Today's Feed ({selectedDate})
                </span>
                <Link
                  to={`/children/${activeChild.id}`}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 no-underline"
                >
                  Full Profile &rarr;
                </Link>
              </div>

              {childPanelLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading daily events...</div>
              ) : childMeals.length === 0 && childActivities.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                  No meals or activities recorded yet for today
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {childMeals.map((m) => (
                    <div key={m.id} className="relative pl-7 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                        <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                          <span>🍽 {m.type}: {m.food}</span>
                          <span className="tabular-nums font-mono text-[11px]">{formatTimeDisplay(m.mealTime)}</span>
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Portion: <strong>{m.status}</strong> {m.notes ? `• "${m.notes}"` : ''}
                        </p>
                      </div>
                    </div>
                  ))}

                  {childActivities.map((a) => (
                    <div key={a.id} className="relative pl-7 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                        <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                          <span>🎨 {a.activityType}: {a.activityDescription}</span>
                          <span className="tabular-nums font-mono text-[11px]">{formatTimeDisplay(a.startTime)}</span>
                        </div>
                        {a.note && <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">"{a.note}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Check In Modal Dialog per spec §8.4 */}
      <Modal
        isOpen={!!checkInTarget}
        onClose={() => setCheckInTarget(null)}
        title={checkInTarget ? `Check In ${checkInTarget.firstName} ${checkInTarget.lastName}` : 'Check In'}
        subtitle="Arrival timestamp and parent notes"
      >
        <form onSubmit={handleConfirmCheckIn} className="flex flex-col gap-4">
          {checkInError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start justify-between gap-2">
              <span>{checkInError}</span>
              {checkInError.toLowerCase().includes('enroll') && (
                <Link
                  to="/enrollment"
                  className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold no-underline"
                >
                  Enroll Now
                </Link>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Arrival Time
            </label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Quick Observation Note (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Happy & energetic', 'Tired / sleepy', 'Mild sniffles', 'Dropped off by father', 'Dropped off by mother'].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setCheckInNote(chip)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    checkInNote === chip
                      ? 'bg-primary-500 text-white border-primary-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              placeholder="Custom arrival note..."
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={() => setCheckInTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" isLoading={isCheckingIn}>
              Confirm Check In
            </Button>
          </div>
        </form>
      </Modal>

      {/* Check Out Modal Dialog per spec §8.4 */}
      <Modal
        isOpen={!!checkOutTarget}
        onClose={() => setCheckOutTarget(null)}
        title={checkOutTarget ? `Check Out ${checkOutTarget.firstName}` : 'Check Out'}
        subtitle="Departure time and authorized pickup verification"
      >
        <form onSubmit={handleConfirmCheckOut} className="flex flex-col gap-4">
          {checkOutError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{checkOutError}</span>
            </div>
          )}

          {checkOutTarget && attendanceMap.get(checkOutTarget.id)?.arrivalTime && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Arrived today at <strong>{formatTimeDisplay(attendanceMap.get(checkOutTarget.id)?.arrivalTime ?? undefined)}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCheckOutTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                }}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                Set to Now
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Exit Time
            </label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Picked Up By
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Mother', 'Father', 'Grandparent', 'Authorized Guardian', 'Emergency Contact'].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setCheckOutNote(chip)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    checkOutNote === chip
                      ? 'bg-rose-600 text-white border-rose-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={checkOutNote}
              onChange={(e) => setCheckOutNote(e.target.value)}
              placeholder="Additional departure notes..."
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={() => setCheckOutTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="lg" isLoading={isCheckingOut}>
              Confirm Departure
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Meal Modal Dialog per spec §8.5 */}
      <Modal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        maxWidth="lg"
        title={mealTargetChild ? `Log Meal for ${mealTargetChild.firstName}` : 'Log Meal Intake'}
        subtitle="Fast food entry with auto-time detection and portion tracking"
      >
        <div className="flex flex-col gap-4">
          {/* Meal Type Segmented Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Meal Category
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[MealType.Breakfast, MealType.Lunch, MealType.Snack, MealType.Dinner, MealType.Other].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setMealType(t)}
                  className={`h-11 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    mealType === t
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Food Input with Quick Suggestion Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Food Item Served
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_FOODS.map((food) => (
                <button
                  type="button"
                  key={food}
                  onClick={() => setMealFood(food)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    mealFood === food
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {food}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={mealFood}
              onChange={(e) => setMealFood(e.target.value)}
              placeholder="e.g. Oatmeal & Apple Slices"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          {/* Portion Eaten - 3 Large Buttons per spec §8.5 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Portion Eaten
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMealStatus(MealStatus.Eaten)}
                className={`h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  mealStatus === MealStatus.Eaten
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>Ate All</span>
              </button>

              <button
                type="button"
                onClick={() => setMealStatus(MealStatus.PartiallyEaten)}
                className={`h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  mealStatus === MealStatus.PartiallyEaten
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">timelapse</span>
                <span>Ate Some</span>
              </button>

              <button
                type="button"
                onClick={() => setMealStatus(MealStatus.NotEaten)}
                className={`h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  mealStatus === MealStatus.NotEaten
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span>Didn't Eat</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder="e.g. Asked for water, ate very well"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          {/* Action Buttons per spec §8.5 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleSaveMeal(true)}
              isLoading={isSavingMeal}
              disabled={!mealFood.trim()}
            >
              Save &amp; Add Another Child
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsMealModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => handleSaveMeal(false)}
                isLoading={isSavingMeal}
                disabled={!mealFood.trim()}
              >
                Save Meal Log
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Quick Activity Modal Dialog per spec §8.6 */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        maxWidth="lg"
        title={activityTargetChild ? `Log Activity for ${activityTargetChild.firstName}` : 'Log Activity'}
        subtitle="Categorized tiles with timer mode for nap/play"
      >
        <div className="flex flex-col gap-4">
          {/* Category Tiles Grid per spec §8.6 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Activity Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.type}
                  onClick={() => {
                    setActivityType(cat.type);
                    setActivityDescription(cat.label);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activityType === cat.type
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                      : `${cat.color} hover:opacity-90`
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Details
            </label>
            <input
              type="text"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              placeholder="e.g. Building block towers, sensory sand play"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          {/* Time & Timer Mode per spec §8.6 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={activityStartTime}
                onChange={(e) => setActivityStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time (Optional)
              </label>
              <input
                type="time"
                disabled={timerMode}
                value={activityEndTime}
                onChange={(e) => setActivityEndTime(e.target.value)}
                placeholder="Still in progress"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs disabled:opacity-50"
              />
            </div>
          </div>

          {/* Timer Mode Toggle */}
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={timerMode}
              onChange={(e) => {
                setTimerMode(e.target.checked);
                if (e.target.checked) setActivityEndTime('');
              }}
              className="w-4 h-4 rounded text-primary-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Timer Mode: Activity is still in progress (nap/outdoor)
            </span>
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Educator Observation
            </label>
            <input
              type="text"
              value={activityNote}
              onChange={(e) => setActivityNote(e.target.value)}
              placeholder="e.g. Very focused and cooperated well with peers"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveActivity}
              isLoading={isSavingActivity}
            >
              Log Activity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
