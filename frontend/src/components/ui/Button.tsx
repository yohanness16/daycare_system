import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 hover:bg-primary-600 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-primary-500/40 active:scale-[0.98]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98]',
  outline:
    'bg-transparent border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98]',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-[0.98]',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-rose-500/40 active:scale-[0.98]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
  md: 'h-10 px-3.5 text-sm rounded-lg gap-2',
  lg: 'h-12 px-5 text-base rounded-xl gap-2.5 font-semibold',
  xl: 'h-14 px-6 text-base rounded-2xl gap-3 font-bold', // 56px staff quick action size per spec §6.1 & §5.3
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'text-[16px]',
  md: 'text-[18px]',
  lg: 'text-[20px]',
  xl: 'text-[22px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[36px] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          <span>Saving...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={`material-symbols-outlined shrink-0 ${ICON_SIZES[size]}`}>{icon}</span>
          )}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && (
            <span className={`material-symbols-outlined shrink-0 ${ICON_SIZES[size]}`}>{icon}</span>
          )}
        </>
      )}
    </button>
  );
};
