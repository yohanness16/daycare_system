import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import { AbsenceReason } from '../types/parent';

export const ParentAbsencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState<AbsenceReason>(AbsenceReason.Sick);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reasonOptions = [
    { value: AbsenceReason.Sick, label: 'Sick / Illness 🤒' },
    { value: AbsenceReason.Appointment, label: 'Medical Appointment 🏥' },
    { value: AbsenceReason.FamilyTrip, label: 'Family Trip / Vacation ✈️' },
    { value: AbsenceReason.Other, label: 'Other Reason' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmitting) return;

    if (new Date(toDate) < new Date(fromDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await parentApi.submitAbsence(id, {
        fromDate,
        toDate,
        reason,
        details,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate(`/parent/children/${id}`);
      }, 1500);
    } catch {
      setErrorMsg('Failed to submit absence notice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to={id ? `/parent/children/${id}` : '/parent'}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Report an Absence
          </h1>
          <p className="text-xs text-slate-500">
            Notify classroom teachers and front desk in advance
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Absence Notice Submitted
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your child&apos;s teachers have been informed and the attendance record will be updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  required
                  min={fromDate}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium"
                />
              </div>
            </div>

            {/* Reason Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Reason for Absence
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reasonOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReason(opt.value)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      reason === opt.value
                        ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                maxLength={500}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Any specific symptoms or information the team should know..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-[10px] text-slate-400 text-right block mt-1">
                {details.length}/500 chars
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Send Absence Notice'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
