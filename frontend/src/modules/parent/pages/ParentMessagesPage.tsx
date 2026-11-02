import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ConversationSummary } from '../types/parent';

export const ParentMessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    parentApi
      .getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = conversations.filter((c) => {
    if (filter === 'unread' && c.unreadCount === 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchPrev = c.lastMessage?.preview.toLowerCase().includes(q);
      const matchKid = c.childName?.toLowerCase().includes(q);
      return matchTitle || matchPrev || matchKid;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header & New Message Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Classroom Messages
          </h1>
          <p className="text-xs text-slate-500">Direct communication with your child&apos;s teachers</p>
        </div>

        <Link
          to="/parent/messages/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">edit_square</span>
          New Message
        </Link>
      </div>

      {/* Working Hours & Emergency Notice Banner per spec §13.1 */}
      <div className="p-3.5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-primary-800 dark:text-primary-300">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <span>Teachers reply during working hours (7:00 AM – 6:00 PM).</span>
        </div>
        <a
          href="tel:+15552345678"
          className="font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0"
        >
          Urgent? Call Desk
        </a>
      </div>

      {/* Search & Filter Chips */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
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
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-500 flex items-center justify-center mx-auto text-2xl">
            💬
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            No messages yet
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Say hello to your child&apos;s teachers or start a conversation anytime.
          </p>
          <Link
            to="/parent/messages/new"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
          >
            Start Conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((convo) => (
            <Link
              key={convo.id}
              to={`/parent/messages/${convo.id}`}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                  {convo.type === 1 ? '🏫' : '💬'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 transition-colors">
                      {convo.title}
                    </h3>
                    {convo.childName && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        About {convo.childName}
                      </span>
                    )}
                  </div>

                  {convo.lastMessage && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {convo.lastMessage.senderName}:{' '}
                      </span>
                      {convo.lastMessage.preview}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {convo.lastMessage?.at || ''}
                </span>
                {convo.unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-600 text-white rounded-full text-[10px] font-black leading-none">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
