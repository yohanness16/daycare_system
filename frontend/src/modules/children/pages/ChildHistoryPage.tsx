import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { MealStatus } from '../../../core/types/enums';
import { attendanceApi } from '../../attendance/attendanceApi';
import type { Attendance } from '../../attendance/types';
import { dailyActivitiesApi } from '../../daily-activities/dailyActivitiesApi';
import type { DailyActivity } from '../../daily-activities/types';
import { mealsApi } from '../../meals/mealsApi';
import type { Meal } from '../../meals/types';
import { childrenApi } from '../childrenApi';
import type { Child } from '../types';

type FilterPeriod = '7days' | '30days' | 'thisMonth' | 'all' | 'custom';
type ActiveTab = 'overview' | 'attendance' | 'meals' | 'activities';

export const ChildHistoryPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [child, setChild] = useState<Child | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [mealRecords, setMealRecords] = useState<Meal[]>([]);
  const [activityRecords, setActivityRecords] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<FilterPeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  useEffect(() => {
    if (!childId) return;

    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [childRes, attRes, mealRes, actRes] = await Promise.all([
          childrenApi.getById(childId),
          attendanceApi.getByChild(childId),
          mealsApi.getByChild(childId),
          dailyActivitiesApi.getByChild(childId),
        ]);

        if (!isMounted) return;
        setChild(childRes);
        setAttendanceRecords(attRes);
        setMealRecords(mealRes);
        setActivityRecords(actRes);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load child history records');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [childId]);

  // Compute filter start and end dates based on selected period
  const { startDateStr, endDateStr } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (period === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDateStr: d.toISOString().split('T')[0], endDateStr: todayStr };
    }
    if (period === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { startDateStr: d.toISOString().split('T')[0], endDateStr: todayStr };
    }
    if (period === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDateStr: d.toISOString().split('T')[0], endDateStr: todayStr };
    }
    if (period === 'custom') {
      return { startDateStr: customStartDate, endDateStr: customEndDate };
    }
    // 'all'
    return { startDateStr: '1970-01-01', endDateStr: '2099-12-31' };
  }, [period, customStartDate, customEndDate]);

  // Filtered records
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((r) => {
      const rDate = r.date || (r.arrivalTime ? r.arrivalTime.split('T')[0] : '');
      return rDate >= startDateStr && rDate <= endDateStr;
    });
  }, [attendanceRecords, startDateStr, endDateStr]);

  const filteredMeals = useMemo(() => {
    return mealRecords.filter((m) => {
      const mDate = m.mealTime ? m.mealTime.split('T')[0] : (m.createdAt ? m.createdAt.split('T')[0] : '');
      return mDate >= startDateStr && mDate <= endDateStr;
    });
  }, [mealRecords, startDateStr, endDateStr]);

  const filteredActivities = useMemo(() => {
    return activityRecords.filter((a) => {
      const aDate = a.startTime ? a.startTime.split('T')[0] : (a.createdAt ? a.createdAt.split('T')[0] : '');
      return aDate >= startDateStr && aDate <= endDateStr;
    });
  }, [activityRecords, startDateStr, endDateStr]);

  // Aggregate stats
  const totalDaysAttended = useMemo(() => {
    const set = new Set(filteredAttendance.filter((r) => r.isPresent).map((r) => r.date));
    return set.size;
  }, [filteredAttendance]);

  const mealsEatenCount = useMemo(() => {
    return filteredMeals.filter(
      (m) => m.status === MealStatus.Eaten || m.status === MealStatus.PartiallyEaten
    ).length;
  }, [filteredMeals]);

  const mealIntakePercent = filteredMeals.length > 0
    ? Math.round((mealsEatenCount / filteredMeals.length) * 100)
    : 100;

  // Group by Date for Unified Ledger View
  const datesSet = useMemo(() => {
    const dates = new Set<string>();
    filteredAttendance.forEach((r) => {
      const d = r.date || r.arrivalTime?.split('T')[0];
      if (d) dates.add(d);
    });
    filteredMeals.forEach((m) => {
      const d = m.mealTime?.split('T')[0];
      if (d) dates.add(d);
    });
    filteredActivities.forEach((a) => {
      const d = a.startTime?.split('T')[0];
      if (d) dates.add(d);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [filteredAttendance, filteredMeals, filteredActivities]);

  if (!childId) {
    return <Navigate to="/children" replace />;
  }

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diffMinutes = Math.round((e - s) / 60000);
      if (diffMinutes <= 0) return null;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/children/${childId}`)}
              className="text-outline hover:text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>{child ? `${child.firstName} ${child.lastName}` : t('children', 'Children')}</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">
              {t('childHistoryTitle', 'Child History Ledger')}
            </span>
          </div>

          <h1 className="text-xl font-bold text-on-surface tracking-tight">
            {child ? `${child.firstName} ${child.lastName}'s Activity & Care History` : t('history', 'Child History')}
          </h1>
          <p className="text-xs text-outline">
            {child?.gender || 'Student'} • DOB: {child?.dateOfBirth || '—'} • Guardian: {child?.guardianName || 'Authorized Family'}
          </p>
        </div>

        {/* Print / Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Report</span>
          </button>
          <Link
            to={`/children/${childId}`}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs font-semibold text-on-primary shadow-xs transition-colors no-underline"
          >
            Student Profile
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Date Range Filter Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-low shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Preset Range Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              period === '7days'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('last7Days', 'Last 7 Days')}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              period === '30days'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('last30Days', 'Last 30 Days')}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('thisMonth')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              period === 'thisMonth'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('thisMonth', 'This Month')}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              period === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('allTime', 'All Time (Since Enrolled)')}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              period === 'custom'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('customRange', 'Custom Range')}
          </button>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono"
            />
            <span className="text-xs text-outline">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono"
            />
          </div>
        )}
      </div>

      {/* 4 Summary Metric Cards for the filtered range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
              {t('daysAttended', 'Days Attended')}
            </span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{totalDaysAttended} Days</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
              {t('totalMealsEaten', 'Meals Logged')}
            </span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{filteredMeals.length} Servings</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">restaurant</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
              {t('consumptionRate', 'Intake Rate')}
            </span>
            <div className="text-xl font-bold text-secondary mt-0.5">{mealIntakePercent}%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">percent</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
              {t('totalActivitiesLogged', 'Activities')}
            </span>
            <div className="text-xl font-bold text-primary mt-0.5">{filteredActivities.length} Logs</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">event_note</span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="border-b border-surface-container-low flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          📅 Daily Ledger View ({datesSet.length} Days)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          {t('attendanceHistory', 'Attendance Table')} ({filteredAttendance.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('meals')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === 'meals'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          {t('mealHistory', 'Meals & Intake Table')} ({filteredMeals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === 'activities'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          {t('activityHistory', 'Daily Activities Table')} ({filteredActivities.length})
        </button>
      </div>

      {/* TAB CONTENT 1: Daily Unified Ledger View */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-outline text-xs bg-surface-container-lowest rounded-xl">
              Loading child history records...
            </div>
          ) : datesSet.length === 0 ? (
            <div className="p-12 text-center text-outline text-xs bg-surface-container-lowest rounded-xl border border-surface-container-low">
              No daily records found within this timeframe.
            </div>
          ) : (
            datesSet.map((dateStr) => {
              const dayAttendance = filteredAttendance.find((r) => (r.date || r.arrivalTime?.split('T')[0]) === dateStr);
              const dayMeals = filteredMeals.filter((m) => m.mealTime?.split('T')[0] === dateStr);
              const dayActivities = filteredActivities.filter((a) => a.startTime?.split('T')[0] === dateStr);

              return (
                <div
                  key={dateStr}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container-low shadow-xs overflow-hidden"
                >
                  {/* Day Header Bar */}
                  <div className="p-3 bg-surface-container-low/60 border-b border-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                      <span className="font-bold text-xs text-on-surface">
                        {new Date(`${dateStr}T12:00:00Z`).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {dayAttendance?.isPresent ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Present ({formatTime(dayAttendance.arrivalTime)} - {formatTime(dayAttendance.departureTime)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline text-[10px] font-medium">
                          No Attendance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Content: Attendance + Meals + Activities */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Attendance Box */}
                    <div className="p-3 rounded-lg bg-surface-container-low/40 border border-surface-container-low flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">fact_check</span>
                        Attendance
                      </span>
                      {dayAttendance ? (
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-outline">Arrival:</span>
                            <span className="font-semibold text-on-surface">{formatTime(dayAttendance.arrivalTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-outline">Departure:</span>
                            <span className="font-semibold text-on-surface">
                              {dayAttendance.departureTime ? formatTime(dayAttendance.departureTime) : 'Active / Unrecorded'}
                            </span>
                          </div>
                          {dayAttendance.note && (
                            <div className="text-[11px] text-outline italic pt-1 border-t border-surface-container">
                              "{dayAttendance.note}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-outline italic">No check-in record</span>
                      )}
                    </div>

                    {/* Meals Box */}
                    <div className="p-3 rounded-lg bg-surface-container-low/40 border border-surface-container-low flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-amber-600">restaurant</span>
                        Meals Intake ({dayMeals.length})
                      </span>
                      {dayMeals.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {dayMeals.map((m) => (
                            <div key={m.id} className="text-xs p-1.5 rounded bg-surface-container-lowest border border-surface-container">
                              <div className="flex justify-between items-center font-semibold">
                                <span>{m.type}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  m.status === MealStatus.Eaten
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.status === MealStatus.PartiallyEaten
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {m.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant truncate">{m.food}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-outline italic">No meals logged</span>
                      )}
                    </div>

                    {/* Activities Box */}
                    <div className="p-3 rounded-lg bg-surface-container-low/40 border border-surface-container-low flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-secondary">event_note</span>
                        Activities ({dayActivities.length})
                      </span>
                      {dayActivities.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {dayActivities.map((a) => {
                            const dur = calculateDuration(a.startTime, a.endTime);
                            return (
                              <div key={a.id} className="text-xs p-1.5 rounded bg-surface-container-lowest border border-surface-container">
                                <div className="flex justify-between items-center font-semibold">
                                  <span>{a.activityType}</span>
                                  <span className="text-[10px] text-outline font-mono">
                                    {formatTime(a.startTime)}{a.endTime ? ` - ${formatTime(a.endTime)}` : ''} {dur ? `(${dur})` : ''}
                                  </span>
                                </div>
                                <p className="text-[11px] text-on-surface-variant line-clamp-1">{a.activityDescription}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-outline italic">No activities logged</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT 2: Attendance Table */}
      {activeTab === 'attendance' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Arrival Time</th>
                  <th className="py-2.5 px-3">Departure Time</th>
                  <th className="py-2.5 px-3">Duration On Floor</th>
                  <th className="py-2.5 px-3">Staff Recorder</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-outline text-xs">
                      No attendance records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((r) => {
                    const dur = calculateDuration(r.arrivalTime, r.departureTime);
                    return (
                      <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-on-surface font-mono">
                          {r.date || r.arrivalTime?.split('T')[0]}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface font-mono">
                          {formatTime(r.arrivalTime)}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface font-mono">
                          {r.departureTime ? formatTime(r.departureTime) : <span className="text-emerald-700 font-semibold">Active</span>}
                        </td>
                        <td className="py-2.5 px-3 text-outline">
                          {dur || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant">
                          {r.recordedByName || 'Staff'}
                        </td>
                        <td className="py-2.5 px-3 text-outline truncate max-w-xs">
                          {r.note || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {r.isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Meals Table */}
      {activeTab === 'meals' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Meal Period</th>
                  <th className="py-2.5 px-3">Food Components</th>
                  <th className="py-2.5 px-3">Intake Amount</th>
                  <th className="py-2.5 px-3">Time Served</th>
                  <th className="py-2.5 px-3">Serving Staff</th>
                  <th className="py-2.5 px-3">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {filteredMeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-outline text-xs">
                      No meal records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredMeals.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-on-surface font-mono">
                        {m.mealTime?.split('T')[0] || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-on-surface max-w-xs truncate" title={m.food}>
                        {m.food}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          m.status === MealStatus.Eaten
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === MealStatus.PartiallyEaten
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-outline font-mono">
                        {formatTime(m.mealTime)}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">
                        {m.staffName || 'Staff'}
                      </td>
                      <td className="py-2.5 px-3 text-outline truncate max-w-xs">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Activities Table */}
      {activeTab === 'activities' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Time Frame (From – To)</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Staff Educator</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-outline text-xs">
                      No activity logs found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((a) => {
                    const dur = calculateDuration(a.startTime, a.endTime);
                    return (
                      <tr key={a.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-on-surface font-mono">
                          {a.startTime?.split('T')[0] || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]">
                            {a.activityType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-on-surface font-mono">
                          {formatTime(a.startTime)} {a.endTime ? `→ ${formatTime(a.endTime)}` : '(Started)'}
                        </td>
                        <td className="py-2.5 px-3 text-outline font-semibold">
                          {dur || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface font-medium max-w-sm truncate" title={a.activityDescription}>
                          {a.activityDescription}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant">
                          {a.recordedByName || 'Staff'}
                        </td>
                        <td className="py-2.5 px-3 text-outline truncate max-w-xs" title={a.note}>
                          {a.note || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
