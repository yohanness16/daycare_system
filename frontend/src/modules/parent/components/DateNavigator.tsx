import React from 'react';

interface DateNavigatorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  className?: string;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  className = '',
}) => {
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isToday = currentDate === getTodayString();

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleTodayClick = () => {
    onDateChange(getTodayString());
  };

  const formattedDisplay = () => {
    try {
      const parts = currentDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return currentDate;
    }
  };

  return (
    <div
      className={`sticky top-0 z-20 flex items-center justify-between p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Previous Day"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {formattedDisplay()}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
              Today
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          disabled={isToday}
          className={`p-1.5 rounded-xl text-slate-700 dark:text-slate-300 transition-colors ${
            isToday
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Next Day"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={currentDate}
          max={getTodayString()}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        />

        {!isToday && (
          <button
            type="button"
            onClick={handleTodayClick}
            className="px-2.5 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Go to Today
          </button>
        )}
      </div>
    </div>
  );
};
