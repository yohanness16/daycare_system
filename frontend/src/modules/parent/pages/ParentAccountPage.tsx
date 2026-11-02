import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { useTheme } from '../../../core/theme/ThemeContext';
import { parentApi } from '../api/parentApi';
import type { ParentProfile } from '../types/parent';

export const ParentAccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ParentProfile | null>(null);

  useEffect(() => {
    parentApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  const handleLogout = async () => {
    if (window.confirm(language === 'am' ? 'ከወላጅ መተግበሪያው መውጣት ይፈልጋሉ?' : 'Are you sure you want to log out of the parent portal?')) {
      await logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Account & Preferences
        </h1>
        <p className="text-xs text-slate-500">Guardian profile, notification matrix, security and data</p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {profile?.firstName ? profile.firstName.charAt(0) : 'P'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {profile ? `${profile.firstName} ${profile.lastName}` : user?.firstName}
            </h2>
            <p className="text-xs text-slate-500">{profile?.email || user?.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.phone}</p>
          </div>
        </div>

        <Link
          to="/parent/children"
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
        >
          My Children
        </Link>
      </div>

      {/* Navigation Sections Grid */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-700/60">
        <Link
          to="/parent/account/notifications"
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                Notification Matrix & Preferences
              </span>
              <span className="text-[11px] text-slate-400">
                Push, email, SMS alerts and quiet hours
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
        </Link>

        <Link
          to="/parent/account/security"
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                Security & Passwords
              </span>
              <span className="text-[11px] text-slate-400">
                Change password, app lock, active sessions
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
        </Link>

        <Link
          to="/parent/account/privacy"
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">policy</span>
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                Privacy & Data Export
              </span>
              <span className="text-[11px] text-slate-400">
                Download my records, consent policies
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
        </Link>

        <Link
          to="/parent/complaints"
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                Feedback & Formal Concerns
              </span>
              <span className="text-[11px] text-slate-400">
                Track formal complaints and responses
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
        </Link>

        <Link
          to="/parent/consents"
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                Consents & Permissions
              </span>
              <span className="text-[11px] text-slate-400">Photo sharing and field trips</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
        </Link>
      </div>

      {/* Preferences (Theme & Language) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Display Preferences</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-slate-500">dark_mode</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Dark Mode (for nighttime checks)
            </span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isDark ? 'bg-primary-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-slate-500">translate</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Language / ቋንቋ
            </span>
          </div>
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'am'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              አማርኛ
            </button>
          </div>
        </div>
      </div>

      {/* Log out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Log Out of Parent Portal
      </button>
    </div>
  );
};
