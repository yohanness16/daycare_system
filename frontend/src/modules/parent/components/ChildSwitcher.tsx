import React from 'react';
import { useParentChild } from '../context/ParentChildContext';
import { ChildAvatar } from './ChildAvatar';

interface ChildSwitcherProps {
  className?: string;
}

export const ChildSwitcher: React.FC<ChildSwitcherProps> = ({ className = '' }) => {
  const { childrenList, selectedChildId, setSelectedChildId } = useParentChild();

  if (childrenList.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-full ${className}`}>
      <button
        type="button"
        onClick={() => setSelectedChildId('all')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          selectedChildId === 'all'
            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        All Children
      </button>

      {childrenList.map((kid) => {
        const isSelected = selectedChildId === kid.childId;
        return (
          <button
            key={kid.childId}
            type="button"
            onClick={() => setSelectedChildId(kid.childId)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              isSelected
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ChildAvatar
              firstName={kid.firstName}
              lastName={kid.lastName}
              status={kid.today.status}
              size="sm"
            />
            <span>{kid.firstName}</span>
          </button>
        );
      })}
    </div>
  );
};
