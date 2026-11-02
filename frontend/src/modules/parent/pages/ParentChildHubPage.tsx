import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ChildFullDetail, WellbeingOverview } from '../types/parent';
import { ChildAvatar } from '../components/ChildAvatar';

export const ParentChildHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<ChildFullDetail | null>(null);
  const [wellbeing, setWellbeing] = useState<WellbeingOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      parentApi.getChildFullDetail(id),
      parentApi.getWellbeingOverview(id),
    ])
      .then(([childRes, wbRes]) => {
        setChild(childRes);
        setWellbeing(wbRes);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !child) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <span className="material-symbols-outlined text-[32px] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const ageYears = Math.floor(child.ageMonths / 12);
  const ageMonthsRemaining = child.ageMonths % 12;

  const hubTiles = [
    {
      to: `/parent/children/${child.id}/day`,
      icon: 'menu_book',
      color: 'bg-primary-50 dark:bg-primary-950/60 text-primary-600',
      title: 'Daily Story',
      desc: "Today's timeline & meals",
    },
    {
      to: `/parent/children/${child.id}/wellbeing`,
      icon: 'favorite',
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600',
      title: 'Well-Being',
      desc: 'Sleep, nutrition & mood',
    },
    {
      to: `/parent/children/${child.id}/photos`,
      icon: 'photo_library',
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600',
      title: 'Photos',
      desc: 'Shared learning moments',
    },
    {
      to: `/parent/children/${child.id}/profile`,
      icon: 'badge',
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600',
      title: 'Child Profile',
      desc: 'Health, contacts & docs',
    },
    {
      to: `/parent/children/${child.id}/absence/new`,
      icon: 'event_busy',
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600',
      title: 'Report Absence',
      desc: 'Submit planned absence',
    },
    {
      to: `/parent/children/${child.id}/pickup/new`,
      icon: 'directions_car',
      color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600',
      title: 'Pickup Change',
      desc: 'Authorized pickups',
    },
    {
      to: `/parent/children/${child.id}/home-note/new`,
      icon: 'note_add',
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600',
      title: 'Morning Note',
      desc: 'Share info with teachers',
    },
    {
      to: `/parent/children/${child.id}/teacher`,
      icon: 'school',
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600',
      title: 'Teacher & Admin Chat',
      desc: 'Educators info & direct messaging',
    },
    {
      to: `/parent/messages?childId=${child.id}`,
      icon: 'chat',
      color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600',
      title: 'Messages',
      desc: 'Chat with classroom staff',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Hub Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ChildAvatar
            firstName={child.firstName}
            lastName={child.lastName}
            photoUrl={child.photoUrl}
            size="xl"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {child.firstName} {child.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {child.classroom.name} · {ageYears} yrs {ageMonthsRemaining} mos · {child.gender}
            </p>

            {/* Teachers Stack */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Teachers:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {child.teachers.map((teacher) => (
                  <Link
                    key={teacher.staffId}
                    to={`/parent/messages?childId=${child.id}&staffId=${teacher.staffId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary-500">
                      chat
                    </span>
                    <span>{teacher.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link
          to={`/parent/children/${child.id}/profile`}
          className="self-end sm:self-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
        >
          View Full Details →
        </Link>
      </div>

      {/* 2. Segmented Shortcuts Grid */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
          Shortcuts & Activities
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {hubTiles.map((tile, idx) => (
            <Link
              key={idx}
              to={tile.to}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xs transition-all flex flex-col items-center text-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform ${tile.color}`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {tile.icon}
                </span>
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                {tile.title}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {tile.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. This Week Summary Card per spec §9.1 */}
      {wellbeing && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                This Week at Daycare
              </h3>
              <p className="text-xs text-slate-500">Attendance, nutrition and nap averages</p>
            </div>
            <Link
              to={`/parent/children/${child.id}/wellbeing`}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Well-Being Center →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Attendance
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {wellbeing.attendance.presentDays} Days Present
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">100% on schedule</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Nutrition
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {Math.round(wellbeing.nutrition.eatenRate * 100)}% Eaten
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Healthy appetite</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Average Nap
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {wellbeing.sleep.avgMinutesPerDay} min / day
              </span>
              <span className="text-[10px] text-primary-600 font-semibold">Restful & calm</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Safety Flags
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {wellbeing.flags.length === 0 ? 'Clear ✓' : `${wellbeing.flags.length} Note`}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">No critical alerts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
