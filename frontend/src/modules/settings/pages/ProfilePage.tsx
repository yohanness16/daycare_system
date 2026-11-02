import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Avatar, Badge, Button } from '../../../components/ui';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, changePassword, logout } = useAuth();
  const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword.length < 4) {
      setPassMessage({ text: 'New password must be at least 4 characters.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }

    try {
      setIsChangingPass(true);
      const success = await changePassword({ currentPassword, newPassword });
      if (success) {
        setPassMessage({ text: 'Password successfully updated!', isError: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMessage({ text: 'Failed to update password. Verify current password.', isError: true });
      }
    } catch (err) {
      setPassMessage({
        text: err instanceof Error ? err.message : 'Error updating password',
        isError: true,
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Account &amp; Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal credentials, appearance preferences, and system access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center">
            <Avatar
              name={`${user?.firstName} ${user?.lastName}`}
              id={user?.id}
              size="xl"
              className="mb-4 shadow-sm"
            />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>

            <div className="mt-3">
              <Badge
                variant={isAdmin ? 'primary' : 'success'}
                label={user?.role || (isAdmin ? 'Administrator' : 'Educator')}
                size="md"
              />
            </div>

            {user?.staffName && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-xs text-slate-500">
                <span>Linked Staff: </span>
                <strong className="text-slate-800 dark:text-slate-200">{user.staffName}</strong>
              </div>
            )}

            <div className="mt-6 w-full">
              <Button
                variant="danger"
                size="md"
                icon="logout"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Theme Preferences Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Appearance &amp; Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dark theme helps reduce eye strain on staff tablets in dimmed quiet or nap rooms.
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dark Mode
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isDarkMode ? 'bg-primary-500 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Change Password */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Change Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Update your account password with a strong combination of letters, numbers, and symbols
            </p>

            {passMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  passMessage.isError
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {passMessage.isError ? 'error' : 'check_circle'}
                </span>
                <span>{passMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 4 characters (8+ recommended)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isChangingPass}
                  icon="lock"
                >
                  Save New Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
