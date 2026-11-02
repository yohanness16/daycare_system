import React from 'react';
import type { AttendanceState } from '../types/parent';

interface ChildAvatarProps {
  firstName: string;
  lastName?: string;
  photoUrl?: string | null;
  status?: AttendanceState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  className?: string;
}

export const ChildAvatar: React.FC<ChildAvatarProps> = ({
  firstName,
  lastName = '',
  photoUrl,
  status,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-2xl',
  };

  const ringColor = {
    Present: 'ring-emerald-500 border-emerald-500 text-emerald-700 bg-emerald-50',
    Late: 'ring-amber-500 border-amber-500 text-amber-700 bg-amber-50',
    Sick: 'ring-orange-500 border-orange-500 text-orange-700 bg-orange-50',
    Absent: 'ring-rose-400 border-rose-400 text-rose-700 bg-rose-50',
    ExcusedAbsence: 'ring-rose-300 border-rose-300 text-rose-600 bg-rose-50',
    CheckedOut: 'ring-blue-500 border-blue-500 text-blue-700 bg-blue-50',
    NotArrived: 'ring-slate-300 border-slate-300 text-slate-600 bg-slate-100',
    CenterClosed: 'ring-slate-300 border-slate-300 text-slate-500 bg-slate-100',
  };

  const currentRing = status ? ringColor[status] || 'ring-slate-300' : 'ring-transparent';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`rounded-full flex items-center justify-center font-bold overflow-hidden shadow-sm transition-all duration-300
          ${sizeClasses[size]} 
          ${status ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${currentRing}` : 'bg-primary-100 text-primary-700'}
          ${pulse ? 'animate-pulse' : ''}
        `}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-semibold select-none">{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 
            ${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            ${status === 'Present' ? 'bg-emerald-500' : ''}
            ${status === 'Late' ? 'bg-amber-500' : ''}
            ${status === 'Sick' ? 'bg-orange-500' : ''}
            ${status === 'Absent' || status === 'ExcusedAbsence' ? 'bg-rose-400' : ''}
            ${status === 'CheckedOut' ? 'bg-blue-500' : ''}
            ${status === 'NotArrived' || status === 'CenterClosed' ? 'bg-slate-400' : ''}
          `}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
