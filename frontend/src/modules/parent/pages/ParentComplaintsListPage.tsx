import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ComplaintDetail } from '../types/parent';
import { ComplaintStatus } from '../types/parent';

export const ParentComplaintsListPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintDetail[]>([]);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    parentApi
      .getComplaints()
      .then(setComplaints)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.Submitted:
        return {
          label: 'Submitted ⏳',
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        };
      case ComplaintStatus.UnderReview:
        return {
          label: 'Under Review 👀',
          className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        };
      case ComplaintStatus.InProgress:
        return {
          label: 'In Progress 🔧',
          className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        };
      case ComplaintStatus.WaitingOnParent:
        return {
          label: 'Action Required ✍️',
          className: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        };
      case ComplaintStatus.Resolved:
        return {
          label: 'Resolved ✅',
          className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        };
      case ComplaintStatus.Closed:
        return {
          label: 'Closed',
          className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        };
      default:
        return {
          label: 'Submitted',
          className: 'bg-slate-100 text-slate-600',
        };
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter === 'open') {
      return (
        c.status !== ComplaintStatus.Resolved &&
        c.status !== ComplaintStatus.Closed &&
        c.status !== ComplaintStatus.Rejected
      );
    }
    if (filter === 'resolved') {
      return c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Feedback & Concerns
          </h1>
          <p className="text-xs text-slate-500">
            A safe, transparent and trackable channel for questions and concerns
          </p>
        </div>

        <Link
          to="/parent/complaints/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Concern
        </Link>
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl max-w-xs">
        <button
          type="button"
          onClick={() => setFilter('open')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'open'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setFilter('resolved')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'resolved'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Resolved
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All
        </button>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-500 flex items-center justify-center mx-auto text-2xl">
            👂
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            We&apos;re Always Listening
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            If something isn&apos;t right with meals, safety, or communication, please share your concern so our management can assist promptly.
          </p>
          <Link
            to="/parent/complaints/new"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
          >
            Submit Feedback
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <Link
                key={item.id}
                to={`/parent/complaints/${item.id}`}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-400 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {item.referenceNumber}
                      </span>
                      {item.childName && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          · {item.childName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-primary-600 transition-colors">
                      {item.subject}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                  <span>Target SLA response: within 24h</span>
                  <span className="font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                    View Thread →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
