import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { authApi } from '../../../core/auth/authApi';
import type { PasswordPolicy } from '../../../core/auth/types';
import { Button } from '../../../components/ui';

export const ChangePasswordPage: React.FC = () => {
  const { user, changePassword, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Password Policy from Backend
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSymbol: false,
  });

  useEffect(() => {
    let isMounted = true;
    authApi
      .getPasswordPolicy()
      .then((res) => {
        if (isMounted) setPolicy(res);
      })
      .catch((err) => {
        console.warn('Using default password policy:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Live checklist criteria against backend policy
  const policyChecks = useMemo(() => {
    return [
      {
        id: 'length',
        label: `At least ${policy.minLength} characters`,
        passed: newPassword.length >= policy.minLength,
        required: true,
      },
      {
        id: 'uppercase',
        label: 'Uppercase letter (A-Z)',
        passed: /[A-Z]/.test(newPassword),
        required: policy.requireUppercase,
      },
      {
        id: 'lowercase',
        label: 'Lowercase letter (a-z)',
        passed: /[a-z]/.test(newPassword),
        required: policy.requireLowercase,
      },
      {
        id: 'digit',
        label: 'At least one number (0-9)',
        passed: /[0-9]/.test(newPassword),
        required: policy.requireDigit,
      },
      {
        id: 'symbol',
        label: 'Special symbol (!@#$%^&*)',
        passed: /[^A-Za-z0-9]/.test(newPassword),
        required: policy.requireSymbol,
      },
      {
        id: 'match',
        label: 'Passwords match',
        passed: Boolean(newPassword && confirmPassword && newPassword === confirmPassword),
        required: true,
      },
    ];
  }, [newPassword, confirmPassword, policy]);

  const activeRequiredChecks = useMemo(() => {
    return policyChecks.filter((c) => c.required);
  }, [policyChecks]);

  const allPassed = useMemo(() => {
    return (
      activeRequiredChecks.every((c) => c.passed) &&
      Boolean(currentPassword) &&
      newPassword !== currentPassword
    );
  }, [activeRequiredChecks, currentPassword, newPassword]);

  // Password strength meter per spec §8.2
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (newPassword.length >= policy.minLength) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-sky-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  }, [newPassword, policy.minLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }
    if (newPassword.length < policy.minLength) {
      setErrorMessage(`New password must be at least ${policy.minLength} characters long.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from your current temporary password.');
      return;
    }
    if (!allPassed) {
      setErrorMessage('Please satisfy all password complexity requirements shown below.');
      return;
    }

    try {
      setIsLoading(true);
      const success = await changePassword({
        currentPassword,
        newPassword,
      });

      if (success) {
        // Redirect to role landing per spec §4.3 & §8.2
        if (isAdmin) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/today', { replace: true });
        }
      } else {
        setErrorMessage('Failed to change password. Please check your temporary password.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <span className="material-symbols-outlined text-[30px]">lock_reset</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user?.firstName || 'Staff Member'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
            Let's secure your daycare portal account with a permanent password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current / Temporary Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Given by your administrator"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Recommended at least 8 characters"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />

              {/* Strength Meter Bar per spec §8.2 */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Password Strength:</span>
                    <span className="font-bold">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Live Password Policy Checklist */}
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Policy Requirements</span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {activeRequiredChecks.filter((c) => c.passed).length}/{activeRequiredChecks.length} Met
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {policyChecks.map((check) => {
                    const isPassed = check.passed;
                    return (
                      <div
                        key={check.id}
                        className={`flex items-center gap-1.5 transition-colors ${
                          isPassed
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px] shrink-0">
                          {isPassed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{check.label}</span>
                      </div>
                    );
                  })}
                </div>
                {newPassword && currentPassword && newPassword === currentPassword && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    <span>New password must differ from temporary password.</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded text-primary-600 cursor-pointer"
                />
                <span>Show passwords</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!allPassed || isLoading}
              className="w-full font-bold shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Password &amp; Continue
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Log out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
