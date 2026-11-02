import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ParentNotification } from '../types/parent';

export const ParentNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'safety'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    parentApi
      .getNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await parentApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClickItem = async (item: ParentNotification) => {
    if (!item.isRead) {
      await parentApi.markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'safety') return n.priority === 'Urgent' || n.type.includes('INCIDENT');
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Notification Alerts
          </h1>
          <p className="text-xs text-slate-500">Real-time alerts, daily logs, and care notifications</p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl max-w-xs">
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
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Unread
        </button>
        <button
          type="button"
          onClick={() => setFilter('safety')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'safety'
              ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Safety 🚨
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🎉
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            You&apos;re All Caught Up
          </h3>
          <p className="text-xs text-slate-400">No unread notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClickItem(item)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                item.isRead
                  ? 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 opacity-80'
                  : item.priority === 'Urgent'
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900'
                  : 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-200/80 dark:border-primary-900/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.priority === 'Urgent'
                    ? 'bg-rose-600 text-white'
                    : 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.priority === 'Urgent' ? 'warning' : 'notifications'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.createdAt}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.body}
                </p>

                {item.actionUrl && (
                  <span className="inline-block mt-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                    View Details →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
