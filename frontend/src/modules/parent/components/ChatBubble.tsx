import React from 'react';
import type { ChatMessage } from '../types/parent';

interface ChatBubbleProps {
  message: ChatMessage;
  onReply?: (message: ChatMessage) => void;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onReply,
  className = '',
}) => {
  const isMe = message.sender.role === 'Parent';

  const renderStatus = () => {
    switch (message.status) {
      case 'sending':
        return <span className="text-[10px] text-slate-400">⏳</span>;
      case 'failed':
        return <span className="text-[10px] text-rose-500 font-bold">⚠ Failed</span>;
      case 'read':
        return (
          <span
            className="material-symbols-outlined text-[14px] text-primary-500 font-bold"
            title="Read"
          >
            done_all
          </span>
        );
      case 'delivered':
        return (
          <span
            className="material-symbols-outlined text-[14px] text-slate-400"
            title="Delivered"
          >
            done_all
          </span>
        );
      case 'sent':
      default:
        return (
          <span className="material-symbols-outlined text-[14px] text-slate-400" title="Sent">
            done
          </span>
        );
    }
  };

  return (
    <div
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3.5 ${className}`}
    >
      {!isMe && (
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {message.sender.name}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
            {message.sender.role}
          </span>
        </div>
      )}

      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs group ${
          isMe
            ? 'bg-primary-600 text-white rounded-tr-xs'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs'
        }`}
      >
        {/* Reply Quote Block */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-xl text-xs border-l-3 ${
              isMe
                ? 'bg-primary-700/60 border-white/60 text-white/90'
                : 'bg-slate-100 dark:bg-slate-700/60 border-primary-500 text-slate-600 dark:text-slate-300'
            }`}
          >
            <p className="line-clamp-2 italic">{message.replyTo.preview}</p>
          </div>
        )}

        {/* Message Content */}
        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
          {message.body}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${
                  isMe ? 'bg-primary-700 text-white' : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">attachment</span>
                <span className="truncate">{att.fileName}</span>
              </a>
            ))}
          </div>
        )}

        {/* Footer info: Timestamp + Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
            isMe ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          <span>{message.createdAt}</span>
          {isMe && renderStatus()}
        </div>

        {/* Reply action button on hover */}
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 shadow-sm transition-opacity ${
              isMe ? '-left-8' : '-right-8'
            }`}
            title="Reply"
          >
            <span className="material-symbols-outlined text-[14px]">reply</span>
          </button>
        )}
      </div>
    </div>
  );
};
