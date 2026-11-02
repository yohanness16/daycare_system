import React from 'react';
import type { TimelineItem } from '../types/parent';
import { PortionIndicator } from './PortionIndicator';

interface TimelineEntryProps {
  item: TimelineItem;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const TimelineEntry: React.FC<TimelineEntryProps> = ({
  item,
  onAction,
  actionLabel,
  className = '',
}) => {
  const getKindConfig = () => {
    switch (item.kind) {
      case 'attendance':
        return {
          icon: 'login',
          color: 'bg-emerald-500 text-white',
          badgeText: 'Attendance',
          dotBg: 'bg-emerald-500',
        };
      case 'meal':
        return {
          icon: 'restaurant',
          color: 'bg-amber-500 text-white',
          badgeText: 'Meal / Snack',
          dotBg: 'bg-amber-500',
        };
      case 'activity':
        return {
          icon: 'palette',
          color: 'bg-purple-500 text-white',
          badgeText: 'Activity',
          dotBg: 'bg-purple-500',
        };
      case 'nap':
        return {
          icon: 'bedtime',
          color: 'bg-indigo-500 text-white',
          badgeText: 'Nap',
          dotBg: 'bg-indigo-500',
        };
      case 'mood':
        return {
          icon: 'mood',
          color: 'bg-teal-500 text-white',
          badgeText: 'Mood',
          dotBg: 'bg-teal-500',
        };
      case 'health':
        return {
          icon: 'thermostat',
          color: 'bg-rose-500 text-white',
          badgeText: 'Health Event',
          dotBg: 'bg-rose-500',
        };
      case 'incident':
        return {
          icon: 'warning',
          color: 'bg-rose-600 text-white',
          badgeText: 'Incident Notice',
          dotBg: 'bg-rose-600',
        };
      case 'photo':
        return {
          icon: 'photo_camera',
          color: 'bg-sky-500 text-white',
          badgeText: 'Moment',
          dotBg: 'bg-sky-500',
        };
      case 'diaper':
        return {
          icon: 'clean_hands',
          color: 'bg-blue-400 text-white',
          badgeText: 'Care Check',
          dotBg: 'bg-blue-400',
        };
      default:
        return {
          icon: 'schedule',
          color: 'bg-slate-400 text-white',
          badgeText: 'Update',
          dotBg: 'bg-slate-400',
        };
    }
  };

  const config = getKindConfig();

  // If meal with portion indicator string
  const portionMatch = item.subtitle?.match(/●{1,3}/);
  const portionNumber = portionMatch
    ? portionMatch[0] === '●●●'
      ? 2
      : portionMatch[0] === '●●○'
      ? 1
      : 0
    : null;

  return (
    <div className={`relative flex items-start gap-4 pb-6 last:pb-0 ${className}`}>
      {/* Timeline spine connecting line */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

      {/* Left Icon Dot */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm ${config.color}`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {config.icon}
        </span>
      </div>

      {/* Entry Body Card */}
      <div className="flex-1 bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {config.badgeText} · {item.time}
          </span>
          {item.author && (
            <span className="text-[11px] text-slate-400 font-medium">
              by {item.author}
            </span>
          )}
        </div>

        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
          {item.title}
        </h4>

        {item.subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {item.subtitle}
          </p>
        )}

        {portionNumber !== null && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <PortionIndicator portion={portionNumber} />
          </div>
        )}

        {onAction && actionLabel && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 rounded-xl text-xs font-bold transition-colors"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
