import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { MealStatus, MealType } from '../../../core/types/enums';
import { useChildren } from '../../children/useChildren';
import type { Child } from '../../children/types';
import { mealsApi } from '../../meals/mealsApi';
import { useStaff } from '../../staff/useStaff';
import { useAttendance } from '../useAttendance';
import { AllergyBadge } from '../../../components/ui';

export const DailyAttendancePage: React.FC = () => {
  const { t } = useLanguage();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Meal Modal State
  const [mealTargetChild, setMealTargetChild] = useState<Child | null>(null);
  const [mealType, setMealType] = useState<MealType>(() => {
    const hour = new Date().getHours();
    if (hour < 10) return MealType.Breakfast;
    if (hour < 14) return MealType.Lunch;
    return MealType.Snack;
  });
  const [mealFood, setMealFood] = useState('');
  const [mealStatus, setMealStatus] = useState<MealStatus>(MealStatus.Eaten);
  const [mealNotes, setMealNotes] = useState('');
  const [mealStaffId, setMealStaffId] = useState('');
  const [isSavingMeal, setIsSavingMeal] = useState(false);

  const { records, presentCount, checkedOutCount, checkIn, checkOut } = useAttendance(selectedDate);
  const { children } = useChildren();
  const { staff } = useStaff();
  const { user } = useAuth();

  // Map of records for current date by childId
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof records)[0]>();
    records.forEach((r) => {
      map.set(r.childId, r);
    });
    return map;
  }, [records]);

  // Filter children by search
  const filteredChildren = useMemo(() => {
    return children.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [children, searchQuery]);

  // Step 1: Mark Present
  const handleMarkPresent = async (child: Child) => {
    try {
      const now = new Date();
      let arrivalTime: string;
      const todayIsoDate = new Date().toISOString().split('T')[0];
      if (selectedDate === todayIsoDate) {
        arrivalTime = now.toISOString();
      } else {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), 0);
        arrivalTime = dt.toISOString();
      }
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await checkIn(
        {
          childId: child.id,
          date: selectedDate,
          arrivalTime,
          note: 'Arrival check-in',
        },
        `${child.firstName} ${child.lastName}`
      );

      setStatusMessage(`${child.firstName} marked present at ${timeFormatted}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Mark present error', err);
      setStatusMessage('Failed to record arrival.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Step 2: Mark Departure
  const handleMarkDeparture = async (child: Child) => {
    try {
      const now = new Date();
      const existing = attendanceMap.get(child.id);
      let exitDate = now;
      const todayIsoDate = new Date().toISOString().split('T')[0];
      if (selectedDate !== todayIsoDate) {
        const [y, m, d] = selectedDate.split('-').map(Number);
        exitDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      }
      if (existing?.arrivalTime) {
        const arrDate = new Date(existing.arrivalTime);
        if (exitDate.getTime() <= arrDate.getTime()) {
          exitDate = new Date(arrDate.getTime() + 1000);
        }
      }
      const exitTime = exitDate.toISOString();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await checkOut({
        childId: child.id,
        date: selectedDate,
        exitTime,
      });

      setStatusMessage(`${child.firstName} marked departed at ${timeFormatted}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Mark departure error', err);
      setStatusMessage('Failed to record departure.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Open Meal Modal
  const handleOpenMealModal = (child: Child) => {
    setMealTargetChild(child);
    setMealFood('');
    setMealNotes('');
    setMealStatus(MealStatus.Eaten);
    const resolvedStaffId = user?.staffId || staff[0]?.id || '';
    setMealStaffId(resolvedStaffId);
  };

  // Save Meal Intake
  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTargetChild || !mealFood.trim()) return;

    try {
      setIsSavingMeal(true);
      const targetStaffId = mealStaffId || user?.staffId || staff[0]?.id || undefined;

      await mealsApi.record({
        childId: mealTargetChild.id,
        staffId: targetStaffId,
        type: mealType,
        food: mealFood.trim(),
        mealTime: new Date().toISOString(),
        status: mealStatus,
        notes: mealNotes.trim(),
      });

      setStatusMessage(`Logged ${mealType} for ${mealTargetChild.firstName}!`);
      setMealTargetChild(null);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Save meal error', err);
      setStatusMessage('Failed to save meal record.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSavingMeal(false);
    }
  };

  // Quick preset foods
  const quickFoodPresets = [
    'Oatmeal & 1% Milk',
    'Apple Slices & Cheddar',
    'Chicken Rice & Carrots',
    'Turkey Sandwich & Banana',
    'Whole Grain Crackers & Cheese',
  ];

  const totalEnrolled = children.length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header & Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            {t('attendance', 'Attendance')} &amp; Daily Desk
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Record physical arrival, departure, and meals directly on the floor
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 py-0.5 rounded text-[10px] bg-surface-container text-primary font-bold hover:bg-surface-container-high uppercase cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Action Status Toast */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">{t('children', 'Enrolled')}</span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{totalEnrolled}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">groups</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">{t('present', 'Present on Floor')}</span>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">{t('absent', 'Departed')}</span>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{checkedOutCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Rate</span>
            <div className="text-xl font-bold text-secondary mt-0.5">{attendanceRate}%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">percent</span>
          </div>
        </div>
      </div>

      {/* Daily Attendance Roll & Meal Desk Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-3.5 border-b border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Student Attendance &amp; Care Desk
            </h2>
            <span className="text-xs text-outline font-medium">({filteredChildren.length} Students)</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
            />
          </div>
        </div>

        {/* Attendance Checklist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/70">
                <th className="py-2.5 px-3 min-w-[160px]">Student</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">1. Present (Arrival)</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">2. Departure (Exit)</th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">Meals Intake</th>
                <th className="py-2.5 px-3 text-right">Status Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-outline text-xs">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredChildren.map((child) => {
                  const record = attendanceMap.get(child.id);
                  const isPresent = record && record.isPresent && !record.departureTime;
                  const isDeparted = record && !!record.departureTime;
                  const notArrived = !record || !record.isPresent;

                  const arrivalTimeFormatted = record?.arrivalTime
                    ? new Date(record.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null;

                  const exitTimeFormatted = record?.departureTime
                    ? new Date(record.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null;

                  return (
                    <tr
                      key={child.id}
                      className={`transition-colors ${
                        isPresent
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/30'
                          : isDeparted
                          ? 'bg-slate-50/60'
                          : 'hover:bg-surface-container-low/30'
                      }`}
                    >
                      {/* Student Name */}
                      <td className="py-3 px-3 font-semibold text-on-surface">
                        <Link
                          to={`/children/${child.id}`}
                          className="text-on-surface hover:text-primary no-underline flex items-center gap-2"
                        >
                          <div
                            className={`w-7 h-7 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDeparted
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-surface-container text-primary'
                            }`}
                          >
                            {child.firstName[0]}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5 flex-wrap">
                              <span>{child.firstName} {child.lastName}</span>
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
                            <div className="text-[10px] text-outline font-normal">
                              {child.gender} • DOB {child.dateOfBirth}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Column 1: Present (Arrival) */}
                      <td className="py-3 px-3 text-center">
                        {notArrived ? (
                          // Case A: Not Arrived -> Active & Clickable
                          <button
                            type="button"
                            onClick={() => handleMarkPresent(child)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all"
                            title="Click to record physical arrival right now"
                          >
                            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                            <span>Mark Present</span>
                          </button>
                        ) : (
                          // Case B & C: Already Arrived -> Grayed Out & Locked until tomorrow!
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none opacity-80"
                            title={`Arrival already recorded at ${arrivalTimeFormatted}`}
                          >
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">check</span>
                            <span>Arrived ({arrivalTimeFormatted})</span>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Departure (Exit) */}
                      <td className="py-3 px-3 text-center">
                        {notArrived ? (
                          // Case A: Not Arrived -> Locked & Grayed Out
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none opacity-50"
                            title="Child must arrive before departure can be recorded"
                          >
                            <span className="material-symbols-outlined text-[15px]">lock</span>
                            <span>Departure</span>
                          </div>
                        ) : isPresent ? (
                          // Case B: Present on Floor -> Opened & Active!
                          <button
                            type="button"
                            onClick={() => handleMarkDeparture(child)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-all"
                            title="Click to record child departure/pickup now"
                          >
                            <span className="material-symbols-outlined text-[16px]">logout</span>
                            <span>Mark Departure</span>
                          </button>
                        ) : (
                          // Case C: Departed -> Grayed Out & Locked until tomorrow!
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none opacity-80"
                            title={`Departure already recorded at ${exitTimeFormatted}`}
                          >
                            <span className="material-symbols-outlined text-[15px] text-amber-600">done_all</span>
                            <span>Departed ({exitTimeFormatted})</span>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Meal Intake (Popup Trigger) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenMealModal(child)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 cursor-pointer transition-all shadow-2xs"
                          title={`Log food intake for ${child.firstName}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">restaurant</span>
                          <span>Have a Meal</span>
                        </button>
                      </td>

                      {/* Column 4: Summary Badge */}
                      <td className="py-3 px-3 text-right">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            On Floor
                          </span>
                        ) : isDeparted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                            Completed Day
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-outline">
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Headcount Log Table */}
      {records.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden">
          <div className="p-3 border-b border-surface-container-low flex items-center justify-between bg-surface-container-lowest">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Today's Physical Headcount Log ({records.length} Records)
            </h3>
            <span className="text-[11px] text-outline font-mono-data">Date: {selectedDate}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Arrival Time</th>
                  <th className="py-2.5 px-3">Departure Time</th>
                  <th className="py-2.5 px-3">Staff Recorder</th>
                  <th className="py-2.5 px-3">Drop-off Note</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {records.map((r) => {
                  const isPresent = r.isPresent && !r.departureTime;

                  return (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-on-surface">
                        <Link to={`/children/${r.childId}`} className="text-on-surface hover:text-primary no-underline">
                          {r.childName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface font-mono-data">
                        {r.arrivalTime
                          ? new Date(r.arrivalTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant font-mono-data">
                        {r.departureTime ? (
                          new Date(r.departureTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-emerald-700 font-semibold">Active on Floor</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-outline">
                        {r.recordedByName || 'Staff'}
                      </td>
                      <td className="py-2.5 px-3 text-outline truncate max-w-xs">
                        {r.note || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isPresent ? 'Checked In' : 'Checked Out'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP: Have a Meal Intake Modal */}
      {mealTargetChild && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  🍽️
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface leading-tight">
                    Log Meal Intake
                  </h2>
                  <p className="text-xs text-primary font-semibold">
                    {mealTargetChild.firstName} {mealTargetChild.lastName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMealTargetChild(null)}
                className="text-outline hover:text-on-surface cursor-pointer p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Meal Period
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer font-medium"
                >
                  {Object.values(MealType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Food Input with Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Food Components Served <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrambled eggs, toast, sliced oranges"
                  value={mealFood}
                  onChange={(e) => setMealFood(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                />

                {/* Quick Food Chips */}
                <div className="flex flex-wrap gap-1">
                  {quickFoodPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMealFood(preset)}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supervising Staff */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Supervising Staff
                </label>
                <select
                  value={mealStaffId}
                  onChange={(e) => setMealStaffId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asked for water, finished whole portion"
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setMealTargetChild(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeal}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSavingMeal && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  <span>Save Meal Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
