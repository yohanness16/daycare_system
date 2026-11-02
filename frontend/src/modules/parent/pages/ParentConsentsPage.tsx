import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ConsentForm } from '../types/parent';

export const ParentConsentsPage: React.FC = () => {
  const [consents, setConsents] = useState<ConsentForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    parentApi
      .getConsents()
      .then(setConsents)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDecision = async (formId: string, decision: 'Granted' | 'Denied') => {
    await parentApi.respondConsent(formId, decision);
    setConsents((prev) =>
      prev.map((c) => (c.id === formId ? { ...c, decision, respondedAt: 'Just now' } : c))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to="/parent"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Consents & Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Control photo sharing, outdoor nature walks, and daycare permissions
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Version {consent.version}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    consent.required
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {consent.required ? 'Mandatory' : 'Optional'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {consent.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {consent.body}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Current Status:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {consent.decision || 'Needs Response'}
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(consent.id, 'Denied')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      consent.decision === 'Denied'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Don&apos;t Allow
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision(consent.id, 'Granted')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      consent.decision === 'Granted'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    Allow & Confirm ✓
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
