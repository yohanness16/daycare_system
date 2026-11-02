import React from 'react';

interface AvatarProps {
  name?: string;
  id?: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'present' | 'absent' | 'departed' | 'none';
}

const PASTEL_PALETTES = [
  { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
];

function getPalette(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[idx];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-12 h-12 text-base font-bold',
  xl: 'w-16 h-16 text-xl font-bold',
};

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  id = '',
  photoUrl,
  size = 'md',
  className = '',
  status = 'none',
}) => {
  const palette = getPalette(id || name);
  const initials = getInitials(name);
  const sizeClasses = SIZE_MAP[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border ${palette.border} shadow-xs`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full flex items-center justify-center select-none border ${palette.border} ${palette.bg} shadow-xs tracking-wider`}
          title={name}
        >
          {initials}
        </div>
      )}

      {status !== 'none' && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900 ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          } ${
            status === 'present'
              ? 'bg-emerald-500'
              : status === 'departed'
              ? 'bg-amber-500'
              : 'bg-slate-300 dark:bg-slate-600'
          }`}
          title={status === 'present' ? 'Present' : status === 'departed' ? 'Departed' : 'Not arrived'}
        />
      )}
    </div>
  );
};
