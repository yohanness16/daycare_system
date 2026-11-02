import React from 'react';
import { ComplaintStatus } from '../types/parent';

interface StatusStepperProps {
  status: ComplaintStatus;
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  status,
  className = '',
}) => {
  const steps = [
    { key: ComplaintStatus.Submitted, label: 'Submitted' },
    { key: ComplaintStatus.UnderReview, label: 'Under Review' },
    { key: ComplaintStatus.InProgress, label: 'In Progress' },
    { key: ComplaintStatus.Resolved, label: 'Resolved' },
  ];

  // Map status index to step level
  const getCurrentStepIndex = () => {
    switch (status) {
      case ComplaintStatus.Submitted:
        return 0;
      case ComplaintStatus.UnderReview:
        return 1;
      case ComplaintStatus.InProgress:
      case ComplaintStatus.WaitingOnParent:
        return 2;
      case ComplaintStatus.Resolved:
      case ComplaintStatus.Closed:
        return 3;
      case ComplaintStatus.Reopened:
        return 2;
      case ComplaintStatus.Rejected:
        return 1;
      default:
        return 0;
    }
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />

        {/* Progress track line */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary-600 transition-all duration-500 -z-0"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                  isDone
                    ? 'bg-primary-600 text-white'
                    : isCurrent
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-2 text-[11px] font-bold text-center ${
                  isCurrent
                    ? 'text-primary-700 dark:text-primary-300'
                    : isDone
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
