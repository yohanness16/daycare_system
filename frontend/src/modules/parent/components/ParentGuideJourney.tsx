import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChildLiveStatus, AttendanceState } from '../types/parent';

interface ParentGuideJourneyProps {
  childId: string;
  childName: string;
  classroomName: string;
  attendanceStatus?: AttendanceState;
  liveStatus?: ChildLiveStatus | null;
}

interface RoutineStage {
  id: string;
  title: string;
  timeWindow: string;
  icon: string;
  description: string;
  parentTip?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export const ParentGuideJourney: React.FC<ParentGuideJourneyProps> = ({
  childId,
  childName,
  classroomName,
  attendanceStatus = 'Present',
  liveStatus,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stages: RoutineStage[] = [
    {
      id: 'dropoff',
      title: 'Arrival & Morning Welcome',
      timeWindow: '7:30 AM – 9:00 AM',
      icon: 'door_front',
      description: 'Morning temperature check, gentle transition into room, and educator greeting.',
      parentTip: 'Drop-off before 9:00 AM helps children settle smoothly into morning circle time.',
      actionLabel: 'Report Absence / Late',
      actionUrl: `/parent/children/${childId}/absence/new`,
    },
    {
      id: 'snack1',
      title: 'Morning Snack & Circle Time',
      timeWindow: '9:15 AM – 10:00 AM',
      icon: 'restaurant',
      description: 'Wholesome organic fruit snack, morning songs, and sensory play.',
    },
    {
      id: 'outdoor',
      title: 'Outdoor Discovery & Motor Skills',
      timeWindow: '10:00 AM – 11:30 AM',
      icon: 'park',
      description: 'Playground exploration, botanical garden walks, and gross motor exercises.',
    },
    {
      id: 'lunch',
      title: 'Nutritious Hot Lunch',
      timeWindow: '11:45 AM – 12:30 PM',
      icon: 'lunch_dining',
      description: 'Balanced family-style meal focused on varied vegetables, grains, and protein.',
      parentTip: 'Staff log portion amounts (All / Most / Some / None) in real-time.',
    },
    {
      id: 'nap',
      title: 'Quiet Rest & Nap Period',
      timeWindow: '12:30 PM – 2:30 PM',
      icon: 'bedtime',
      description: 'Soothing white noise, low lighting, and personalized cots for restorative sleep.',
      parentTip: 'Classroom messaging is gently paused during quiet nap time to avoid room chimes.',
      actionLabel: 'Send Morning/Sleep Note',
      actionUrl: `/parent/children/${childId}/home-note/new`,
    },
    {
      id: 'afternoon',
      title: 'Afternoon Exploration & Snack',
      timeWindow: '2:45 PM – 4:00 PM',
      icon: 'draw',
      description: 'STEM building, creative arts, and healthy afternoon snacks.',
    },
    {
      id: 'pickup',
      title: 'Ready for Safe Pickup',
      timeWindow: '4:15 PM – 6:00 PM',
      icon: 'directions_car',
      description: 'Story recap, packing cubby items, and verified guardian handover.',
      parentTip: 'Sending a different guardian or friend? Submit an authorized pickup notice by 3:00 PM.',
      actionLabel: 'Update Pickup Person',
      actionUrl: `/parent/children/${childId}/pickup/new`,
    },
  ];

  // Calculate current stage dynamically based on liveStatus and current time
  const getCurrentStageIndex = (): number => {
    if (attendanceStatus === 'CheckedOut') return 6;
    if (attendanceStatus === 'Sick' || attendanceStatus === 'Absent') return -1;

    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const timeDecimal = hour + minutes / 60;

    if (liveStatus?.currentActivity?.description.toLowerCase().includes('nap')) return 4;
    if (timeDecimal < 9.0) return 0;
    if (timeDecimal < 10.0) return 1;
    if (timeDecimal < 11.5) return 2;
    if (timeDecimal < 12.5) return 3;
    if (timeDecimal < 14.5) return 4;
    if (timeDecimal < 16.25) return 5;
    return 6;
  };

  const currentStageIndex = getCurrentStageIndex();
  const activeStage = stages[Math.max(0, currentStageIndex)];

  return (
    <section className="rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 p-5 sm:p-6 shadow-xs">
      {/* Header with Title and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0ECE1] dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E06A3B]/10 text-[#E06A3B] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Daily Routine Guide
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 border border-[#3A7D5C]/20">
                {classroomName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Follow {childName}&apos;s milestones throughout the daycare day
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E06A3B] hover:bg-[#E06A3B]/10 dark:hover:bg-[#E06A3B]/20 transition-colors"
        >
          <span>{isExpanded ? 'Compact View' : 'All 7 Milestones'}</span>
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </button>
      </div>

      {/* Current Active Milestone Highlight Banner */}
      {currentStageIndex >= 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#FDFBF7] to-[#F7F4EC] dark:from-slate-800 dark:to-slate-800/60 border border-[#E3DCCE] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3A7D5C] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">{activeStage.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3A7D5C] dark:text-emerald-400">
                  Current Milestone · Step {currentStageIndex + 1} of 7
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({activeStage.timeWindow})</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {activeStage.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {activeStage.description}
              </p>
              {activeStage.parentTip && (
                <div className="mt-2 text-[11px] text-[#742C14] dark:text-orange-200 bg-[#E06A3B]/10 dark:bg-[#E06A3B]/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 inline-flex">
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  <span>{activeStage.parentTip}</span>
                </div>
              )}
            </div>
          </div>

          {activeStage.actionLabel && activeStage.actionUrl && (
            <Link
              to={activeStage.actionUrl}
              className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-[#FDFBF7] text-slate-800 dark:text-slate-100 border border-[#E3DCCE] dark:border-slate-600 text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs text-center flex items-center justify-center gap-1.5"
            >
              <span>{activeStage.actionLabel}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          )}
        </div>
      )}

      {/* Progress Stepper Bar (Horizontal on tablet/desktop, compact on mobile) */}
      <div className="mt-4 pt-3">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center text-center group"
                title={`${stage.title} (${stage.timeWindow})`}
              >
                {/* Step indicator circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#3A7D5C] text-white shadow-2xs'
                      : isCurrent
                      ? 'bg-[#E06A3B] text-white ring-4 ring-[#E06A3B]/20 scale-105 shadow-xs'
                      : 'bg-[#F0ECE1] dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage short label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-bold mt-1.5 truncate max-w-full block ${
                    isCurrent
                      ? 'text-[#E06A3B] dark:text-orange-400 font-extrabold'
                      : isCompleted
                      ? 'text-[#3A7D5C] dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {stage.title.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Accordion: Full 7-stage details */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-[#F0ECE1] dark:border-slate-700 space-y-2.5">
          {stages.map((st, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={st.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#E06A3B]/5 dark:bg-[#E06A3B]/10 border-[#E06A3B]/30'
                    : isCompleted
                    ? 'bg-[#3A7D5C]/5 dark:bg-[#3A7D5C]/10 border-[#3A7D5C]/20'
                    : 'bg-white dark:bg-slate-800/60 border-[#F0ECE1] dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[16px] ${
                        isCompleted
                          ? 'bg-[#3A7D5C] text-white'
                          : isCurrent
                          ? 'bg-[#E06A3B] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {st.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{st.timeWindow}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-[#3A7D5C]/10 text-[#3A7D5C]'
                        : isCurrent
                        ? 'bg-[#E06A3B]/10 text-[#E06A3B]'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? 'Done' : isCurrent ? 'Active Now' : 'Upcoming'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 pl-9">
                  {st.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
