import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { useDashboard } from '../useDashboard';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const {
    selectedDate,
    setSelectedDate,
    goToToday,
    stats,
    classrooms,
    attendance,
    eventTimeline,
    isLoading,
    isRefreshing,
    error,
    refetch,
    quickCheckOut,
  } = useDashboard({ autoRefreshIntervalMs: 30000 });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {isAdmin
              ? t('dashboard', 'Dashboard')
              : `${t('welcomeBack', 'Welcome')}, ${user?.firstName || 'Educator'}! 👋`}
          </h1>
          <p className="text-xs text-outline mt-0.5">
            {isAdmin
              ? 'Real-time overview of attendance, classrooms, and facility operations'
              : t('welcomeStaffSubtitle', 'Educator Daily Workspace • Roll call, meal intake, and activity tracking')}
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-on-surface focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={goToToday}
              className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-primary font-bold hover:bg-surface-container-high uppercase cursor-pointer"
            >
              Today
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] text-secondary ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {isAdmin ? (
            <Link
              to="/children/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-xs transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Register Child</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>{t('attendance', 'Attendance')}</span>
              </Link>
              <Link
                to="/meals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">restaurant</span>
                <span>{t('meals', 'Meals')}</span>
              </Link>
              <Link
                to="/activities"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-xs transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">event_note</span>
                <span>{t('activities', 'Activities')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Staff Hero: Go to Today Board per spec §8.3 */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
              Staff Daily Priority
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold mt-0.5">
              Roll Call &amp; Fast Floor Logging
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-xl">
              Check in arriving students, track meal portions, and record daily activities in a few taps.
            </p>
          </div>
          <Link
            to="/today"
            className="px-5 py-2.5 rounded-xl bg-white text-primary-600 font-extrabold text-xs sm:text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 self-start sm:self-auto no-underline shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
            <span>Go to Today Board &rarr;</span>
          </Link>
        </div>
      )}

      {/* 4 Clean Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enrolled Children */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-low flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('children', 'Enrolled Children')}</span>
            <span className="material-symbols-outlined text-[20px] text-primary">child_care</span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">
                {stats?.activeEnrollmentsCount ?? 0}
              </span>
              <span className="text-xs text-outline">
                {isAdmin ? `/ ${stats?.totalClassroomCapacity ?? 56} Capacity` : 'Active Students'}
              </span>
            </div>
            {isAdmin && (
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.min(100, stats?.overallOccupancyPercentage ?? 0)}%` }}
                />
              </div>
            )}
          </div>
          <div className="text-[11px] text-outline flex items-center justify-between pt-2 border-t border-surface-container-low">
            <span>{isAdmin ? 'Occupancy Rate' : 'Enrolled Total'}</span>
            <span className="font-semibold text-primary">
              {isAdmin ? `${stats?.overallOccupancyPercentage ?? 0}%` : `${stats?.activeEnrollmentsCount ?? 0} Children`}
            </span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-low flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('present', 'Present on Floor')}</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">fact_check</span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {stats?.presentTodayCount ?? 0}
              </span>
              <span className="text-xs text-outline">
                / {stats?.activeEnrollmentsCount ?? 0} Total
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, stats?.attendanceRate ?? 0)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-outline flex items-center justify-between pt-2 border-t border-surface-container-low">
            <span>Attendance Rate</span>
            <span className="font-semibold text-emerald-700">{stats?.attendanceRate ?? 0}%</span>
          </div>
        </div>

        {/* Card 3: Staff on Duty (Admin) vs Attendance Desk (Staff) */}
        {isAdmin ? (
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-low flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">Staff on Duty</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">badge</span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">
                  {stats?.totalStaff ?? 0}
                </span>
                <span className="text-xs text-outline">Active Staff</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="text-[11px] text-outline flex items-center justify-between pt-2 border-t border-surface-container-low">
              <span>Staff Ratio</span>
              <span className="font-semibold text-secondary">Compliant</span>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-low flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('activities', 'Activities Logged')}</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">event_note</span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">
                  {eventTimeline.filter((e) => e.category === 'activity').length}
                </span>
                <span className="text-xs text-outline">Sessions Today</span>
              </div>
            </div>
            <div className="text-[11px] text-outline flex items-center justify-between pt-2 border-t border-surface-container-low">
              <span>Classroom Action</span>
              <Link to="/activities" className="font-semibold text-primary hover:underline no-underline">
                View Activities
              </Link>
            </div>
          </div>
        )}

        {/* Card 4: Meals Logged */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-low flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('meals', 'Meals Served')}</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">restaurant</span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">
                {stats?.mealsLoggedTodayCount ?? 0}
              </span>
              <span className="text-xs text-outline">Meals Logged</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="text-[11px] text-outline flex items-center justify-between pt-2 border-t border-surface-container-low">
            <span>Meal Records</span>
            <Link to="/meals" className="font-semibold text-primary hover:underline no-underline">
              View Log
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Classrooms & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Classroom Occupancy (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Classrooms Status
            </h2>
            <Link
              to="/classrooms"
              className="text-xs font-semibold text-secondary hover:underline no-underline"
            >
              All Classrooms
            </Link>
          </div>

          <div className="space-y-3">
            {classrooms.map((room) => {
              const occupancyPercent = room.capacity > 0 ? Math.round((room.enrolledCount / room.capacity) * 100) : 0;
              return (
                <div
                  key={room.id}
                  className="p-3.5 rounded-xl bg-surface-container-low/50 border border-surface-container-low hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/classrooms/${room.id}`}
                        className="text-sm font-bold text-on-surface hover:text-primary no-underline"
                      >
                        {room.name}
                      </Link>
                      <span className="text-[11px] text-outline font-medium">
                        ({room.staffToChildRatio})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {room.status}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Occupancy</span>
                      <span className="font-semibold">
                        {room.enrolledCount} / {room.capacity} ({occupancyPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-outline pt-1.5 border-t border-surface-container/60">
                    <span>Present: <strong className="text-emerald-700">{room.presentCount}</strong></span>
                    <span className="truncate max-w-[150px]">
                      Staff: {room.assignedStaff.length > 0 ? room.assignedStaff.map((s) => s.name).join(', ') : 'Assigned'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Today's Attendance Roll Call (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Present Children
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
                {attendance?.stillPresentList.length ?? 0}
              </span>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-semibold text-secondary hover:underline no-underline"
            >
              Full Attendance Sheet
            </Link>
          </div>

          {attendance?.stillPresentList && attendance.stillPresentList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider">
                    <th className="py-2.5 px-3">Child</th>
                    <th className="py-2.5 px-3">Arrival</th>
                    <th className="py-2.5 px-3">Staff</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.stillPresentList.slice(0, 7).map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-surface-container-low/50 hover:bg-surface-container-low/30"
                    >
                      <td className="py-2.5 px-3 font-semibold text-on-surface">
                        <Link
                          to={`/children/${item.childId}`}
                          className="text-on-surface hover:text-primary no-underline"
                        >
                          {item.childName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-outline">
                        {item.arrivalTime
                          ? new Date(item.arrivalTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant font-medium">
                        {item.recordedByName || 'Staff'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/children/${item.childId}/history`}
                            className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                            title="View child history"
                          >
                            <span className="material-symbols-outlined text-[16px]">history</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => quickCheckOut(item.childId)}
                            className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] cursor-pointer"
                          >
                            Check Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-outline text-xs">
              No children checked in yet for this date.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Recent Operations
          </h2>
          <span className="text-xs text-outline">Live activity stream</span>
        </div>

        <div className="divide-y divide-surface-container-low">
          {eventTimeline.slice(0, 5).map((evt) => (
            <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    evt.category === 'attendance'
                      ? 'bg-emerald-500'
                      : evt.category === 'meal'
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  }`}
                />
                <span className="font-semibold text-on-surface">{evt.title}</span>
                <span className="text-outline truncate max-w-sm">{evt.subtitle}</span>
              </div>
              <span className="text-outline text-[11px] shrink-0">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
