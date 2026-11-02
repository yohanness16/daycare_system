import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { authApi } from '../../../core/auth/authApi';
import type { PasswordPolicy } from '../../../core/auth/types';

export const ParentChangePasswordPage: React.FC = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    authApi.getPasswordPolicy().then(setPolicy).catch(() => {
      // Default standard fallback policy
      setPolicy({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSymbol: true,
      });
    });
  }, []);

  const hasLength = policy ? newPassword.length >= policy.minLength : newPassword.length >= 8;
  const hasUpper = policy?.requireUppercase ? /[A-Z]/.test(newPassword) : true;
  const hasLower = policy?.requireLowercase ? /[a-z]/.test(newPassword) : true;
  const hasDigit = policy?.requireDigit ? /[0-9]/.test(newPassword) : true;
  const hasSymbol = policy?.requireSymbol ? /[^A-Za-z0-9]/.test(newPassword) : true;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const isFormValid =
    currentPassword.length > 0 &&
    hasLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSymbol &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const success = await changePassword({
      currentPassword,
      newPassword,
    });

    if (success) {
      const onboardingDone = localStorage.getItem('parent_onboarding_done');
      if (!onboardingDone) {
        navigate('/parent/welcome', { replace: true });
      } else {
        navigate('/parent', { replace: true });
      }
    } else {
      setIsSubmitting(false);
      setErrorMessage('Could not update password. Please check your current password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12151C] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <span className="material-symbols-outlined text-[36px]">lock_reset</span>
          </div>
        </div>

        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Let&apos;s make your account yours 🔒
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Please set your own secure password to complete your account setup.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Current (Temporary) Password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Password Policy Live Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Password Requirements:
              </span>
              <div className={`flex items-center gap-2 ${hasLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {hasLength ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>At least {policy?.minLength || 8} characters</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {hasUpper ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {hasLower ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center gap-2 ${hasDigit ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {hasDigit ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>At least one number (0-9)</span>
              </div>
              <div className={`flex items-center gap-2 ${hasSymbol ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {hasSymbol ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>At least one special character (!@#$%)</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {passwordsMatch ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:cursor-not-allowed transition-all mt-4"
            >
              {isSubmitting ? 'Saving Password...' : 'Save Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
