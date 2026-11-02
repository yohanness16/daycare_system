import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  trend?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  onClick?: () => void;
  className?: string;
}

const VARIANT_ICONS = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  variant = 'primary',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-between gap-4 ${
        onClick ? 'cursor-pointer hover:border-primary-500/30' : ''
      } ${className}`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
          {value}
        </div>
        {trend && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {trend}
          </span>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${VARIANT_ICONS[variant]}`}
      >
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
    </div>
  );
};
