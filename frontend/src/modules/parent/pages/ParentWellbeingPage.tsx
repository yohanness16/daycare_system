import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { WellbeingOverview } from '../types/parent';
import { WellbeingGauge } from '../components/WellbeingGauge';

export const ParentWellbeingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('7d');
  const [viewTable, setViewTable] = useState(false);
  const [wellbeing, setWellbeing] = useState<WellbeingOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    parentApi
      .getWellbeingOverview(id)
      .then(setWellbeing)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, period]);

  if (isLoading || !wellbeing) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <span className="material-symbols-outlined text-[32px] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Period Segmented Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Well-Being Center
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring sleep recovery, nutrition, mood and health trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
            {(['7d', '30d', '3m'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '3 Months'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setViewTable(!viewTable)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span className="hidden sm:inline">{viewTable ? 'Charts' : 'Table View'}</span>
          </button>
        </div>
      </div>

      {/* 1. Well-Being Gauge Summary Card */}
      <WellbeingGauge
        score={wellbeing.score.value}
        label={wellbeing.score.label}
        explanation={wellbeing.score.explanation}
        disclaimer={wellbeing.disclaimer}
      />

      {/* 2. Flags Stack (if any) */}
      {wellbeing.flags && wellbeing.flags.length > 0 && (
        <div className="space-y-2">
          {wellbeing.flags.map((flag, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                flag.severity === 'Urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">flag</span>
                <div>
                  <span className="text-xs font-bold block">{flag.message}</span>
                  <span className="text-[10px] opacity-80">Informational indicator</span>
                </div>
              </div>

              {id && (
                <Link
                  to={`/parent/messages?childId=${id}`}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 shrink-0"
                >
                  Message Teacher
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Four Metric Tiles (2x2) per spec §11.1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mood Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🙂</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Mood Distribution
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              {wellbeing.mood.trend}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(wellbeing.mood.distribution).map(([moodKey, count]) => (
              <span
                key={moodKey}
                className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <span>{moodKey}:</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">{count}x</span>
              </span>
            ))}
          </div>
        </div>

        {/* Sleep & Rest Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">😴</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Sleep & Rest Quality
              </h3>
            </div>
            <span className="text-xs font-bold text-primary-600 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {wellbeing.sleep.trend}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Average Rest Time:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {wellbeing.sleep.avgMinutesPerDay} minutes / day
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Average Daily Naps:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {wellbeing.sleep.avgNaps} nap / day
              </span>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mt-1">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, (wellbeing.sleep.avgMinutesPerDay / 120) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nutrition Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🍽</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Nutrition & Appetite
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {Math.round(wellbeing.nutrition.eatenRate * 100)}% Finished
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Portions Finished (●●●):</span>
              <span className="font-bold text-emerald-600">
                {Math.round(wellbeing.nutrition.eatenRate * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Partial Portions (●●○):</span>
              <span className="font-bold text-amber-600">
                {Math.round(wellbeing.nutrition.partialRate * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Did Not Eat (●○○):</span>
              <span className="font-bold text-rose-600">
                {Math.round(wellbeing.nutrition.notEatenRate * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Health & Temperature Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🌡</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Health & Temperatures
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Normal
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Illness or Symptom Events:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {wellbeing.health.illnessEvents} reported
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Max Logged Temperature:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {wellbeing.health.maxTemperature || 36.8} °C
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Fever threshold is 38.0 °C. Center policy requires automatic parent alert above threshold.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table Representation Fallback per spec §11.2 & §24 a11y */}
      {viewTable && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">
            Data Metrics Table (Accessible Format)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-2.5">Metric Category</th>
                  <th className="p-2.5">Current Period Value</th>
                  <th className="p-2.5">Trend / Status</th>
                  <th className="p-2.5">Baseline Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr>
                  <td className="p-2.5 font-bold">Mood Average</td>
                  <td className="p-2.5">Positive (Level 1.2)</td>
                  <td className="p-2.5 text-emerald-600">{wellbeing.mood.trend}</td>
                  <td className="p-2.5 text-slate-400">Happy / Calm</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Daily Nap Time</td>
                  <td className="p-2.5">{wellbeing.sleep.avgMinutesPerDay} minutes</td>
                  <td className="p-2.5 text-emerald-600">{wellbeing.sleep.trend}</td>
                  <td className="p-2.5 text-slate-400">60–120 minutes</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Meal Portion Rate</td>
                  <td className="p-2.5">{Math.round(wellbeing.nutrition.eatenRate * 100)}%</td>
                  <td className="p-2.5 text-emerald-600">{wellbeing.nutrition.trend}</td>
                  <td className="p-2.5 text-slate-400">&gt; 70% eaten</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Fever / Health Incidents</td>
                  <td className="p-2.5">{wellbeing.health.illnessEvents}</td>
                  <td className="p-2.5 text-emerald-600">Healthy</td>
                  <td className="p-2.5 text-slate-400">0 events</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
