import React, { useState } from 'react';

interface WellbeingGaugeProps {
  score: number; // 0 to 100
  label: string;
  explanation: string;
  disclaimer?: string;
  className?: string;
}

export const WellbeingGauge: React.FC<WellbeingGaugeProps> = ({
  score,
  label,
  explanation,
  disclaimer = 'These indicators are informational and do not constitute clinical diagnosis.',
  className = '',
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Determine stroke color and track
  const getColor = () => {
    if (score >= 80) return { stroke: '#2FB67C', text: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { stroke: '#F5A524', text: 'text-amber-600 dark:text-amber-400' };
    return { stroke: '#E5484D', text: 'text-rose-600 dark:text-rose-400' };
  };

  const { stroke, text } = getColor();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`rounded-3xl p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              className="text-slate-100 dark:text-slate-700 fill-none"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={stroke}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="fill-none transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${text}`}>{score}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              out of 100
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              Weekly Index
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {label}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            {explanation}
          </p>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline mt-2"
          >
            <span className="material-symbols-outlined text-[14px]">info</span>
            <span>How is this calculated?</span>
          </button>
        </div>
      </div>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-500">health_and_safety</span>
                Well-Being Index Calculation
              </h4>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Our Well-Being Index is a weighted composite score designed to give parents a quick, reassuring view of their child’s week at daycare:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Mood & Engagement (30%)</strong>: Observations recorded during circle and play hours.</li>
                <li><strong>Sleep & Rest (20%)</strong>: Nap regularity and total rest minutes compared to baseline.</li>
                <li><strong>Nutrition (25%)</strong>: Meal portions eaten across morning snack, lunch, and afternoon snack.</li>
                <li><strong>Attendance Consistency (10%)</strong>: Regularity and timeliness of arrivals.</li>
                <li><strong>Health & Incident-Free Days (15%)</strong>: Absence of fevers, symptoms, or safety flags.</li>
              </ul>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs mt-3">
                ⚠️ {disclaimer}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
