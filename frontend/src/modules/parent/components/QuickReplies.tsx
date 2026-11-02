import React from 'react';

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  className?: string;
}

const DEFAULT_QUICK_REPLIES = [
  'Running 15 min late 🚗',
  'Someone else will pick up today',
  'Please call me when convenient',
  'Thank you so much! 🙏',
  'Did he take his nap today?',
];

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  onSelect,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar ${className}`}
    >
      {DEFAULT_QUICK_REPLIES.map((reply, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(reply)}
          className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 transition-colors shadow-2xs"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};
