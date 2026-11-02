import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ConversationSummary, ChatMessage } from '../types/parent';

interface DashboardQuickMessageProps {
  childId?: string;
  childName?: string;
  classroomName?: string;
  teacherName?: string;
}

export const DashboardQuickMessage: React.FC<DashboardQuickMessageProps> = ({
  childId,
  childName = 'Your child',
  classroomName = 'Sunshine Room',
  teacherName = 'Lead Teacher',
}) => {
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState(false);

  const quickPills = [
    'Running 10 mins late for pickup',
    'Grandma is authorized to pick up today',
    'Gave soothing drops at 7:30 AM',
    'Thank you so much for the photo update!',
  ];

  const loadConversation = useCallback(async () => {
    try {
      const convos = await parentApi.getConversations();

      // Find conversation matching this child or fallback to first
      let matched = convos.find((c) => c.childId === childId);
      if (!matched && convos.length > 0) {
        matched = convos[0];
      }
      setActiveConversation(matched || null);

      if (matched) {
        const msgs = await parentApi.getMessages(matched.id);
        setRecentMessages(msgs.slice(-3));
      }
    } catch (err) {
      console.error('Failed to load dashboard quick messages:', err);
    }
  }, [childId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      let targetConvId = activeConversation?.id;

      // If no conversation exists yet, create one
      if (!targetConvId) {
        const newConvo = await parentApi.createConversation({
          childId,
          title: `${childName}'s Care Team`,
          initialMessage: trimmed,
        });
        targetConvId = newConvo.id;
        setActiveConversation(newConvo);
      } else {
        await parentApi.sendMessage(targetConvId, trimmed);
      }

      setInputText('');
      setSendSuccessToast(true);
      setTimeout(() => setSendSuccessToast(false), 3500);

      // Refresh recent snippet
      if (targetConvId) {
        const msgs = await parentApi.getMessages(targetConvId);
        setRecentMessages(msgs.slice(-3));
      }
    } catch (err) {
      console.error('Failed to send quick message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const lastMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 p-5 sm:p-6 shadow-xs">
      {/* Header with Teacher presence and Direct link */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F0ECE1] dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-[#E06A3B]/10 text-[#E06A3B] flex items-center justify-center font-bold text-sm shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            {/* Online Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#3A7D5C] border-2 border-white dark:border-slate-800" title="Active on duty" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                {teacherName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 border border-[#3A7D5C]/20">
                {classroomName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#3A7D5C]">verified</span>
              <span>Available for direct parent updates</span>
            </p>
          </div>
        </div>

        <Link
          to={activeConversation ? `/parent/messages/${activeConversation.id}` : '/parent/messages'}
          className="text-xs font-bold text-[#E06A3B] hover:text-[#D9531E] flex items-center gap-1 hover:underline"
        >
          <span>Full Thread</span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>
      </div>

      {/* Recent Message Sneak Peek */}
      {lastMessage ? (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#FDFBF7] dark:bg-slate-800 border border-[#E3DCCE] dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {lastMessage.sender.role === 'Parent' ? 'You' : lastMessage.sender.name}
            </span>
            <span>{lastMessage.createdAt}</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
            {lastMessage.body}
          </p>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-2xl bg-[#FDFBF7] dark:bg-slate-800/60 border border-[#E3DCCE] text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#3A7D5C]">chat_bubble</span>
          <span>No recent messages yet today. Send a quick note below!</span>
        </div>
      )}

      {/* Fast 1-Tap Quick Reply Chips */}
      <div className="mt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
          Quick 1-Tap Messages
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSendMessage(pill)}
              disabled={isSending}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F2F7F4] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-[#E3DCCE] dark:border-slate-700 hover:border-[#3A7D5C] transition-all active:scale-[0.98] text-left"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Instant Message Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${teacherName}...`}
            disabled={isSending}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#FDFBF7] dark:bg-slate-800 border border-[#E3DCCE] dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E06A3B] focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2.5 rounded-2xl bg-[#E06A3B] hover:bg-[#D9531E] disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          {isSending ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <>
              <span>Send</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </>
          )}
        </button>
      </form>

      {/* Success Notification Alert */}
      {sendSuccessToast && (
        <div className="mt-3 p-2.5 rounded-xl bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 border border-[#3A7D5C]/20 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Message delivered to {teacherName}!</span>
        </div>
      )}
    </div>
  );
};
