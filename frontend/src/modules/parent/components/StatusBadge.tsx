import React from 'react';
import type { AttendanceState } from '../types/parent';

interface StatusBadgeProps {
  status: AttendanceState;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    AttendanceState,
    { label: string; icon: string; bg: string; text: string; border: string }
  > = {
    Present: {
      label: 'At Daycare',
      icon: 'check_circle',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    NotArrived: {
      label: 'Expected Today',
      icon: 'schedule',
      bg: 'bg-slate-50 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    },
    Late: {
      label: 'Late Arrival',
      icon: 'update',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    CheckedOut: {
      label: 'Picked Up',
      icon: 'family_restroom',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    Absent: {
      label: 'Marked Absent',
      icon: 'cancel',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
    },
    ExcusedAbsence: {
      label: 'Excused Absence',
      icon: 'event_busy',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
    },
    Sick: {
      label: 'Sick Leave',
      icon: 'sick',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
    },
    CenterClosed: {
      label: 'Center Closed',
      icon: 'lock',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
    },
  };

  const current = configs[status] || configs.NotArrived;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {showIcon && (
        <span className="material-symbols-outlined text-[14px]">
          {current.icon}
        </span>
      )}
      {current.label}
    </span>
  );
};
