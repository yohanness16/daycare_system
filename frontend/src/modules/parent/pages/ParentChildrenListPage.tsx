import React from 'react';
import { Link } from 'react-router-dom';
import { useParentChild } from '../context/ParentChildContext';
import { ChildAvatar } from '../components/ChildAvatar';
import { StatusBadge } from '../components/StatusBadge';

export const ParentChildrenListPage: React.FC = () => {
  const { childrenList } = useParentChild();

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          My Children
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select a child to view their daily stories, well-being history, or manage pickups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {childrenList.map((kid) => (
          <div
            key={kid.childId}
            className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <ChildAvatar
                    firstName={kid.firstName}
                    lastName={kid.lastName}
                    photoUrl={kid.photoUrl}
                    status={kid.today.status}
                    size="lg"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {kid.firstName} {kid.lastName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {kid.classroom.name} · {Math.floor(kid.ageMonths / 12)}y {kid.ageMonths % 12}m
                    </p>
                  </div>
                </div>

                <StatusBadge status={kid.today.status} />
              </div>

              {/* Today Status Note */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold block mb-0.5">Current Activity:</span>
                <span className="opacity-90">
                  {kid.today.currentActivity?.description || 'Arrived and settled with class'}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/70 grid grid-cols-2 gap-2">
              <Link
                to={`/parent/children/${kid.childId}`}
                className="py-2.5 px-3 rounded-xl bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 text-primary-700 dark:text-primary-300 text-xs font-bold text-center transition-colors"
              >
                Child Hub
              </Link>
              <Link
                to={`/parent/children/${kid.childId}/day`}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition-colors"
              >
                Daily Story
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
