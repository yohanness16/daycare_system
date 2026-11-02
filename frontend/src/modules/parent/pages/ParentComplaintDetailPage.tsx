import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ComplaintDetail } from '../types/parent';
import { ComplaintStatus } from '../types/parent';
import { StatusStepper } from '../components/StatusStepper';
import { RatingStars } from '../components/RatingStars';

export const ParentComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    parentApi
      .getComplaint(id)
      .then((c) => {
        setComplaint(c);
        if (c?.satisfactionRating) {
          setRating(c.satisfactionRating);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !replyText.trim() || isReplying) return;

    setIsReplying(true);
    try {
      await parentApi.sendComplaintMessage(id, replyText);
      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: `msg-${Date.now()}`,
                  authorRole: 'Parent',
                  authorName: 'You',
                  body: replyText,
                  createdAt: new Date().toISOString(),
                  attachments: [],
                },
              ],
            }
          : prev
      );
      setReplyText('');
    } catch {
      alert('Failed to send reply.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleRate = async (newRating: number) => {
    if (!id) return;
    setRating(newRating);
    await parentApi.rateComplaint(id, newRating);
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reopenReason.trim()) return;

    await parentApi.reopenComplaint(id, reopenReason);
    setComplaint((prev) =>
      prev
        ? {
            ...prev,
            status: ComplaintStatus.Reopened,
          }
        : prev
    );
    setShowReopenModal(false);
    setReopenReason('');
  };

  if (isLoading || !complaint) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <span className="material-symbols-outlined text-[32px] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const isResolved = complaint.status === ComplaintStatus.Resolved;
  const isClosed = complaint.status === ComplaintStatus.Closed;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/parent/complaints"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <span className="text-[11px] font-mono font-bold text-slate-400 block">
            {complaint.referenceNumber}
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {complaint.subject}
          </h1>
        </div>
      </div>

      {/* 1. Status Stepper Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>
            Assigned to: <strong>{complaint.assignedTo?.name || 'Center Leadership'}</strong>
          </span>
          <span>Target SLA: within 24h</span>
        </div>
        <StatusStepper status={complaint.status} />
      </div>

      {/* 2. Resolution Card (when Resolved) per spec §14.3 */}
      {isResolved && (
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <span className="material-symbols-outlined text-[22px]">verified</span>
            <h3 className="font-bold text-sm">Issue Resolved by Leadership</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Our center director has investigated and closed this concern with the classroom team.
          </p>

          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Rate your resolution experience:
              </span>
              <RatingStars initialRating={rating} onRate={handleRate} />
            </div>

            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 text-xs font-bold text-emerald-700 rounded-xl hover:bg-emerald-100"
            >
              Reopen (if unsatisfied)
            </button>
          </div>
        </div>
      )}

      {/* 3. Thread Messages */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-500">forum</span>
          Communication Thread
        </h3>

        <div className="space-y-3">
          {complaint.messages.map((msg) => {
            const isMe = msg.authorRole === 'Parent';
            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border ${
                  isMe
                    ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-200/60 dark:border-primary-900/40 ml-4'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {msg.authorName} ({msg.authorRole})
                  </span>
                  <span className="text-slate-400 text-[10px]">{msg.createdAt.slice(0, 10)}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {msg.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Composer (unless closed) */}
        {!isClosed && (
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
            <textarea
              rows={3}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add additional information or reply to the director..."
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isReplying || !replyText.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {isReplying ? 'Sending...' : 'Send Follow-up'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              Reopen Formal Concern
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please let our leadership team know why the resolution was not satisfactory.
            </p>

            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                rows={3}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Reason for reopening..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  Reopen Concern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
