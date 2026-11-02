import React from 'react';

interface PortionIndicatorProps {
  portion: number; // 0=None, 1=Some, 2=All
  showLabel?: boolean;
  className?: string;
}

export const PortionIndicator: React.FC<PortionIndicatorProps> = ({
  portion,
  showLabel = true,
  className = '',
}) => {
  const getPortionData = () => {
    switch (portion) {
      case 2:
        return {
          label: 'Ate all',
          colorClass: 'text-emerald-500 fill-emerald-500',
          dots: [true, true, true],
        };
      case 1:
        return {
          label: 'Ate some',
          colorClass: 'text-amber-500 fill-amber-500',
          dots: [true, true, false],
        };
      case 0:
      default:
        return {
          label: "Didn't eat",
          colorClass: 'text-rose-500 fill-rose-500',
          dots: [true, false, false],
        };
    }
  };

  const { label, colorClass, dots } = getPortionData();

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label={`Meal portion: ${label}`}
      title={label}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {dots.map((filled, idx) => (
          <span
            key={idx}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              filled
                ? colorClass === 'text-emerald-500 fill-emerald-500'
                  ? 'bg-emerald-500'
                  : colorClass === 'text-amber-500 fill-amber-500'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};
