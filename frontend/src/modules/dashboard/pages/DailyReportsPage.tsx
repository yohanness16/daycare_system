import React, { useMemo, useState, useEffect } from 'react';
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayLocalDateString,
} from '../../../core/utils/dateUtils';
import { Badge, Button, SearchField, StatCard } from '../../../components/ui';
import { attendanceApi } from '../../attendance/attendanceApi';
import type { Attendance } from '../../attendance/types';
import { mealsApi } from '../../meals/mealsApi';
import type { Meal } from '../../meals/types';
import { dailyActivitiesApi } from '../../daily-activities/dailyActivitiesApi';
import type { DailyActivity } from '../../daily-activities/types';

export const DailyReportsPage: React.FC = () => {
  const todayStr = useMemo(() => getTodayLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [activeTab, setActiveTab] = useState<'attendance' | 'meals' | 'activities'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');

  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [activitiesList, setActivitiesList] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all daily datasets for selectedDate
  useEffect(() => {
    let isMounted = true;
    const fetchDayData = async () => {
      try {
        setIsLoading(true);
        const [att, meals, acts] = await Promise.all([
          attendanceApi.getDaily(selectedDate),
          mealsApi.getDaily(selectedDate),
          dailyActivitiesApi.getDaily(selectedDate),
        ]);
        if (isMounted) {
          setAttendanceList(att);
          setMealsList(meals);
          setActivitiesList(acts);
        }
      } catch (err) {
        console.error('Failed to load daily reports data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDayData();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

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

  // Filtered records
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((a) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (a.childName || '').toLowerCase().includes(q) || (a.recordedByName || '').toLowerCase().includes(q);
    });
  }, [attendanceList, searchQuery]);

  const filteredMeals = useMemo(() => {
    return mealsList.filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (m.childName || '').toLowerCase().includes(q) ||
        (m.food || '').toLowerCase().includes(q) ||
        (m.type || '').toLowerCase().includes(q)
      );
    });
  }, [mealsList, searchQuery]);

  const filteredActivities = useMemo(() => {
    return activitiesList.filter((act) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (act.childName || '').toLowerCase().includes(q) ||
        (act.activityType || '').toLowerCase().includes(q) ||
        (act.activityDescription || '').toLowerCase().includes(q)
      );
    });
  }, [activitiesList, searchQuery]);

  // Client-side CSV export per spec §8.15
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'attendance') {
      csvContent += 'Child,Arrival Time,Departure Time,Recorded By,Notes\n';
      filteredAttendance.forEach((a) => {
        csvContent += `"${a.childName || 'Child'}","${a.arrivalTime}","${a.departureTime || ''}","${a.recordedByName || ''}","${a.note || ''}"\n`;
      });
    } else if (activeTab === 'meals') {
      csvContent += 'Child,Meal Type,Food,Time,Status,Staff,Notes\n';
      filteredMeals.forEach((m) => {
        csvContent += `"${m.childName || 'Child'}","${m.type}","${m.food}","${m.mealTime}","${m.status}","${m.staffName || ''}","${m.notes || ''}"\n`;
      });
    } else {
      csvContent += 'Child,Activity Type,Description,Start Time,End Time,Recorded By,Notes\n';
      filteredActivities.forEach((act) => {
        csvContent += `"${act.childName || 'Child'}","${act.activityType}","${act.activityDescription}","${act.startTime}","${act.endTime || ''}","${act.recordedByName || ''}","${act.note || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daycare_${activeTab}_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full print-page">
      {/* Top Command Bar & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Daily Center Reports
            </h1>
            <Badge variant="info" label="Audit & Export" size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Center-wide operational audit for {formatDateDisplay(selectedDate)}
          </p>
        </div>

        {/* Date Selector & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Navigator */}
          <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 px-2 focus:outline-none cursor-pointer"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            icon="download"
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            icon="print"
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Strip per spec §8.15 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Attendance Logs"
          value={attendanceList.length}
          icon="fact_check"
          variant="success"
          trend={`${attendanceList.filter((a) => !a.departureTime).length} currently present on floor`}
        />
        <StatCard
          label="Meal Servings"
          value={mealsList.length}
          icon="restaurant"
          variant="warning"
          trend={`${mealsList.filter((m) => m.status === 'Eaten').length} fully consumed`}
        />
        <StatCard
          label="Activities Logged"
          value={activitiesList.length}
          icon="event_note"
          variant="primary"
          trend="Learning, play, nap & sensory"
        />
      </div>

      {/* Report Tabs & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
        {/* Navigation Tabs Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>Attendance ({attendanceList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('meals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'meals'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">lunch_dining</span>
              <span>Meals &amp; Nutrition ({mealsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'activities'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">palette</span>
              <span>Daily Activities ({activitiesList.length})</span>
            </button>
          </div>

          <div className="w-full sm:w-64">
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter table rows..."
            />
          </div>
        </div>

        {/* Printable Header Notice */}
        <div className="hidden print:block p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">Daycare Operational Daily Report</h2>
          <p className="text-sm text-slate-600">Date: {formatDateDisplay(selectedDate)} | Tab: {activeTab.toUpperCase()}</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-xs">Loading daily records...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: Attendance Table */}
            {activeTab === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Arrival</th>
                      <th className="py-3 px-4">Departure</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No attendance records found for this date
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {row.childName || 'Child'}
                          </td>
                          <td className="py-3 px-4 font-mono">{formatTimeDisplay(row.arrivalTime ?? undefined)}</td>
                          <td className="py-3 px-4 font-mono">
                            {row.departureTime ? formatTimeDisplay(row.departureTime) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {row.departureTime ? (
                              <Badge variant="neutral" label="Departed" size="sm" />
                            ) : (
                              <Badge variant="success" label="Present" size="sm" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {row.recordedByName || 'Staff Member'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic">{row.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

        {/* Tab 2: Meals Table */}
        {activeTab === 'meals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Child</th>
                  <th className="py-3 px-4">Meal Type</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Portion Consumed</th>
                  <th className="py-3 px-4">Serving Time</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No meal records logged for this date
                    </td>
                  </tr>
                ) : (
                  filteredMeals.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {m.childName || 'Child'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-700 dark:text-amber-400">
                        {m.type}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {m.food}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.status === 'Eaten'
                              ? 'success'
                              : m.status === 'PartiallyEaten'
                              ? 'warning'
                              : 'danger'
                          }
                          label={m.status}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono">{formatTimeDisplay(m.mealTime)}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {m.staffName || 'Staff Member'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{m.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Activities Table */}
        {activeTab === 'activities' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Child</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No activities logged for this date
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {act.childName || 'Child'}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-400">
                        {act.activityType}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {act.activityDescription}
                      </td>
                      <td className="py-3 px-4 font-mono">{formatTimeDisplay(act.startTime)}</td>
                      <td className="py-3 px-4 font-mono">
                        {act.endTime ? formatTimeDisplay(act.endTime) : 'In Progress'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {act.recordedByName || 'Staff Member'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{act.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
