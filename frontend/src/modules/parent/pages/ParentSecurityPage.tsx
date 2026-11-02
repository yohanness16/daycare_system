import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';

export const ParentSecurityPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [sessionTerminated, setSessionTerminated] = useState(false);

  const handleLogoutEverywhere = async () => {
    if (window.confirm('Log out of all active devices? You will need to sign in again.')) {
      setSessionTerminated(true);
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1200);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to="/parent/account"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Security & Login
          </h1>
          <p className="text-xs text-slate-500">Manage credentials, device sessions, and app protection</p>
        </div>
      </div>

      {sessionTerminated && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
          ✓ All active sessions revoked. Logging out...
        </div>
      )}

      {/* 1. Password Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Account Password
            </h2>
            <p className="text-xs text-slate-500">Last updated recently</p>
          </div>
          <Link
            to="/parent/change-password"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Change Password
          </Link>
        </div>
      </div>

      {/* 2. Biometric / App Lock */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
        <div className="pr-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Biometric App Lock
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Require Face ID / Touch ID / Device PIN when switching back into the app after 5 minutes of inactivity.
          </p>
        </div>
        <input
          type="checkbox"
          checked={appLockEnabled}
          onChange={(e) => setAppLockEnabled(e.target.checked)}
          className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
        />
      </div>

      {/* 3. Active Sessions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Active Logged-in Devices
          </h2>
          <span className="text-[11px] text-slate-400">2 active sessions</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600">smartphone</span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Current Browser / Mobile App
                </span>
                <span className="text-[10px] text-slate-400">Active now · IP verified</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
              This Device
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">laptop</span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Desktop Web Portal
                </span>
                <span className="text-[10px] text-slate-400">Last active 2 days ago</span>
              </div>
            </div>
            <span className="text-xs text-slate-400">Safari / Mac</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogoutEverywhere}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors border border-rose-200 dark:border-rose-900"
        >
          Revoke All Other Sessions
        </button>
      </div>
    </div>
  );
};
