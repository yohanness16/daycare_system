import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'neutral'
  | 'learning'
  | 'play'
  | 'nap'
  | 'outdoor'
  | 'art'
  | 'music';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: string;
  label: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_MAP: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  danger: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/60',
  },
  primary: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  neutral: {
    bg: 'bg-slate-100 dark:bg-slate-800/70',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  learning: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  play: {
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  nap: {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  outdoor: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  art: {
    bg: 'bg-pink-50 dark:bg-pink-950/50',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  music: {
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  label,
  size = 'sm',
  className = '',
}) => {
  const styles = VARIANT_MAP[variant] || VARIANT_MAP.neutral;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1 font-semibold rounded-md'
      : 'px-2.5 py-1 text-xs gap-1.5 font-bold rounded-lg';

  return (
    <span
      className={`inline-flex items-center border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} select-none ${className}`}
    >
      {icon && (
        <span
          className={`material-symbols-outlined shrink-0 ${
            size === 'sm' ? 'text-[13px]' : 'text-[15px]'
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </span>
  );
};
