import React from 'react';

interface CapacityBarProps {
  current: number;
  capacity: number;
  label?: string;
  showDetails?: boolean;
  className?: string;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({
  current,
  capacity,
  label,
  showDetails = true,
  className = '',
}) => {
  const safeCapacity = Math.max(capacity, 1);
  const percentage = Math.min(Math.round((current / safeCapacity) * 100), 100);

  // Status color logic per spec: green < 80%, amber 80-99%, red 100%
  let barColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  let statusText = 'Open';

  if (current >= safeCapacity) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    statusText = 'Full';
  } else if (percentage >= 80) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    statusText = 'Nearly full';
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            {label && <span>{label}</span>}
            <span className="tabular-nums text-slate-900 dark:text-slate-100 font-bold">
              {current} / {capacity}
            </span>
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
            {statusText} ({percentage}%)
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
