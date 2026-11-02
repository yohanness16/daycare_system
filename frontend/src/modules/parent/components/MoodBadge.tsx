import React from 'react';
import { MoodLevel } from '../types/parent';

interface MoodBadgeProps {
  mood: MoodLevel | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({
  mood,
  size = 'md',
  className = '',
}) => {
  if (mood === null || mood === undefined) return null;

  const configs: Record<
    MoodLevel,
    { icon: string; label: string; bg: string; text: string }
  > = {
    [MoodLevel.VeryHappy]: {
      icon: 'sentiment_very_satisfied',
      label: 'Very Happy',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    [MoodLevel.Happy]: {
      icon: 'sentiment_satisfied',
      label: 'Happy',
      bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
    },
    [MoodLevel.Calm]: {
      icon: 'self_improvement',
      label: 'Calm',
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
    },
    [MoodLevel.Tired]: {
      icon: 'bedtime',
      label: 'Tired',
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
    },
    [MoodLevel.Fussy]: {
      icon: 'sentiment_dissatisfied',
      label: 'Fussy',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
    },
    [MoodLevel.Sad]: {
      icon: 'sentiment_very_dissatisfied',
      label: 'Sad',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-700 dark:text-indigo-300',
    },
    [MoodLevel.Upset]: {
      icon: 'mood_bad',
      label: 'Upset',
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
    },
  };

  const current = configs[mood] || configs[MoodLevel.Happy];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${current.bg} 
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} 
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-[16px] leading-none select-none">
        {current.icon}
      </span>
      <span>{current.label}</span>
    </span>
  );
};
