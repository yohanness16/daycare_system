import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ParentDailyReport } from '../types/parent';
import { DateNavigator } from '../components/DateNavigator';
import { TimelineEntry } from '../components/TimelineEntry';
import { MoodBadge } from '../components/MoodBadge';
import { ChildAvatar } from '../components/ChildAvatar';

export const ParentDailyStoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(queryDate);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [report, setReport] = useState<ParentDailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    parentApi
      .getDailyReport(id, currentDate)
      .then(setReport)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, currentDate]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    setSearchParams({ date: newDate });
  };

  const handleIncidentAcknowledge = async (incidentId: string) => {
    await parentApi.acknowledgeIncident(incidentId);
    if (report) {
      setReport({
        ...report,
        incidents: report.incidents.map((inc) =>
          inc.id === incidentId ? { ...inc, acknowledged: true } : inc
        ),
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Date Navigator & Day/Week Segmented Control */}
      <div className="space-y-3">
        <DateNavigator currentDate={currentDate} onDateChange={handleDateChange} />

        <div className="flex items-center justify-between">
          <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Day Story
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition-colors"
              title="Print or Save PDF"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
      ) : viewMode === 'week' ? (
        /* Week Summary View */
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
            Past 5 School Days
          </h3>
          {[0, 1, 2, 3, 4].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() - offset);
            const dateStr = d.toISOString().split('T')[0];
            const displayStr = d.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={dateStr}
                onClick={() => {
                  handleDateChange(dateStr);
                  setViewMode('day');
                }}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-primary-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 font-bold text-xs">
                    {displayStr.split(',')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {displayStr}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      8:15 AM – 5:00 PM · 2 Meals · 1h 30m Nap
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MoodBadge mood={1} size="sm" />
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : report ? (
        /* Single Day Daily Story */
        <div className="space-y-5">
          {/* 2. Story Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-primary-50/20 to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <ChildAvatar
                  firstName={report.childName.split(' ')[0]}
                  lastName={report.childName.split(' ')[1] || ''}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {report.childName}&apos;s Day
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {report.isPublished
                      ? `Shared by Ms. Dinah · Published at 3:30 PM`
                      : 'Live story in progress · Will be published at pick-up time'}
                  </p>
                </div>
              </div>

              {report.overallMood !== undefined && (
                <MoodBadge mood={report.overallMood} size="md" />
              )}
            </div>

            {/* Teacher's End-of-Day Summary Note */}
            {report.summary && (
              <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-primary-100 dark:border-primary-950/60 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-primary-700 dark:text-primary-300">
                  <span className="material-symbols-outlined text-[16px]">format_quote</span>
                  <span>Teacher&apos;s Daily Reflection</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{report.summary}&rdquo;
                </p>
              </div>
            )}

            {/* Highlights Row */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Arrived: {report.attendance.arrivalTime || '8:15 AM'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Left: {report.attendance.departureTime || 'In Daycare'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                😴 Nap: 1h 30m
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                🍽 Meals: Ate well
              </span>
            </div>
          </div>

          {/* 3. Incidents Acknowledgment Banner (if unacknowledged) */}
          {report.incidents &&
            report.incidents.map(
              (inc) =>
                !inc.acknowledged && (
                  <div
                    key={inc.id}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                      </span>
                      <div>
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-100 block">
                          Incident requires review: {inc.summary}
                        </span>
                        <span className="text-[11px] text-rose-700 dark:text-rose-300">
                          Please acknowledge that you have been notified of this care note.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleIncidentAcknowledge(inc.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                      Acknowledge ✓
                    </button>
                  </div>
                )
            )}

          {/* 4. Vertical Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-500">timeline</span>
              Chronological Timeline
            </h3>

            <div className="space-y-1">
              {report.timeline.map((entry, idx) => (
                <TimelineEntry
                  key={idx}
                  item={entry}
                  actionLabel={
                    entry.kind === 'incident' ? 'View Incident' : undefined
                  }
                  onAction={
                    entry.kind === 'incident'
                      ? () => navigate(`/parent/incidents/${entry.refId}`)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* 5. Prompt for tomorrow / Footer Chat action */}
          <div className="p-5 rounded-3xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Have a question or update for tomorrow?
              </h4>
              <p className="text-xs text-slate-500">
                Leave a morning note for the teacher or message the classroom directly.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {id && (
                <Link
                  to={`/parent/children/${id}/home-note/new`}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl text-center hover:bg-slate-50 transition-colors"
                >
                  Share Morning Note
                </Link>
              )}
              {id && (
                <Link
                  to={`/parent/messages?childId=${id}`}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl text-center transition-colors"
                >
                  Ask Teacher
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-500">
          No daily report found for this date.
        </div>
      )}
    </div>
  );
};
