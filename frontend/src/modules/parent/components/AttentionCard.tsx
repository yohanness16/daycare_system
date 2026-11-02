import React from 'react';
import { Link } from 'react-router-dom';

interface AttentionCardProps {
  severity?: 'Urgent' | 'Watch' | 'Info';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({
  severity = 'Watch',
  title,
  description,
  actionLabel = 'Review & Acknowledge',
  actionUrl,
  onAction,
  onDismiss,
  className = '',
}) => {
  const styles = {
    Urgent: {
      card: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100',
      badge: 'bg-rose-600 text-white',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
      icon: 'priority_high',
    },
    Watch: {
      card: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-500 text-white',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
      icon: 'warning',
    },
    Info: {
      card: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-500 text-white',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
      icon: 'info',
    },
  };

  const current = styles[severity];

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${current.card} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1">
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${current.badge}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {current.icon}
          </span>
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/20">
              {severity}
            </span>
            <h4 className="font-bold text-sm leading-tight">{title}</h4>
          </div>
          <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0">
        {actionUrl ? (
          <Link
            to={actionUrl}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${current.btn}`}
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${current.btn}`}
          >
            {actionLabel}
          </button>
        ) : null}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
};
