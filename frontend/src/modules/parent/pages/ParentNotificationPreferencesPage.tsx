import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ParentNotificationPreferencesPage: React.FC = () => {
  const [deliveryStyle, setDeliveryStyle] = useState<'Instant' | 'Digest'>('Instant');
  const [quietHours, setQuietHours] = useState(true);
  const [quietStart, setQuietStart] = useState('21:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [lockScreenPrivacy, setLockScreenPrivacy] = useState(true);

  // Channels matrix state
  const [matrix, setMatrix] = useState({
    dailyUpdates: { inApp: true, push: true, email: false, sms: false },
    healthSafety: { inApp: true, push: true, email: true, sms: true },
    messages: { inApp: true, push: true, email: false, sms: false },
    announcements: { inApp: true, push: true, email: true, sms: false },
  });

  const [savedToast, setSavedToast] = useState(false);

  const toggleChannel = (row: keyof typeof matrix, col: 'push' | 'email' | 'sms') => {
    // Safety Lock Rule per spec §16.2: Health & Safety requires at least one external channel
    if (row === 'healthSafety') {
      const current = matrix.healthSafety;
      const countActive = (current.push ? 1 : 0) + (current.email ? 1 : 0) + (current.sms ? 1 : 0);
      if (current[col] && countActive <= 1) {
        alert(
          "Safety Lock Policy: Child health and incident alerts require at least one active external channel (Push, Email, or SMS) so you're always reachable in an emergency."
        );
        return;
      }
    }

    setMatrix((prev) => ({
      ...prev,
      [row]: {
        ...prev[row],
        [col]: !prev[row][col],
      },
    }));
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
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
            Notification Preferences
          </h1>
          <p className="text-xs text-slate-500">
            Control alert channels, quiet hours, and lock-screen privacy
          </p>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
          ✓ Preferences saved successfully
        </div>
      )}

      {/* 1. Notification Channels Matrix per spec §16.2 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Channels & Categories Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Select how you would like to receive updates per topic.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5">Category</th>
                <th className="py-2.5 text-center">In-App</th>
                <th className="py-2.5 text-center">Push</th>
                <th className="py-2.5 text-center">Email</th>
                <th className="py-2.5 text-center">SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  Daily Stories & Meals
                </td>
                <td className="py-3 text-center">✓</td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.dailyUpdates.push}
                    onChange={() => toggleChannel('dailyUpdates', 'push')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.dailyUpdates.email}
                    onChange={() => toggleChannel('dailyUpdates', 'email')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.dailyUpdates.sms}
                    onChange={() => toggleChannel('dailyUpdates', 'sms')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
              </tr>

              <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                <td className="py-3 font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Health & Safety Alerts
                </td>
                <td className="py-3 text-center font-bold text-rose-600">✓</td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.healthSafety.push}
                    onChange={() => toggleChannel('healthSafety', 'push')}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.healthSafety.email}
                    onChange={() => toggleChannel('healthSafety', 'email')}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.healthSafety.sms}
                    onChange={() => toggleChannel('healthSafety', 'sms')}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  Messages & Chat
                </td>
                <td className="py-3 text-center">✓</td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.messages.push}
                    onChange={() => toggleChannel('messages', 'push')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.messages.email}
                    onChange={() => toggleChannel('messages', 'email')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.messages.sms}
                    onChange={() => toggleChannel('messages', 'sms')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  Announcements & Events
                </td>
                <td className="py-3 text-center">✓</td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.announcements.push}
                    onChange={() => toggleChannel('announcements', 'push')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.announcements.email}
                    onChange={() => toggleChannel('announcements', 'email')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.announcements.sms}
                    onChange={() => toggleChannel('announcements', 'sms')}
                    className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Style */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Delivery Style
          </h2>
          <p className="text-xs text-slate-500">
            Choose how you receive regular classroom activity logs
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setDeliveryStyle('Instant')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              deliveryStyle === 'Instant'
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-primary-600">notifications_active</span>
              <span className="text-xs font-bold">Instant Updates</span>
            </div>
            <p className="text-[11px] text-slate-500">Real-time alerts as entries happen during the day.</p>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryStyle('Digest')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              deliveryStyle === 'Digest'
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-primary-600">mark_email_read</span>
              <span className="text-xs font-bold">Evening Digest</span>
            </div>
            <p className="text-[11px] text-slate-500">A clean daily summary bundle sent at 5:30 PM.</p>
          </button>
        </div>
      </div>

      {/* 2. Quiet Hours */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Quiet Hours
            </h2>
            <p className="text-xs text-slate-500">
              Mute non-urgent notifications during nighttime rest
            </p>
          </div>
          <input
            type="checkbox"
            checked={quietHours}
            onChange={(e) => setQuietHours(e.target.checked)}
            className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
          />
        </div>

        {quietHours && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                From Time
              </label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                To Time
              </label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-[11px]">
          ⚠️ Urgent child safety or medical alerts always bypass quiet hours.
        </div>
      </div>

      {/* 3. Lock-Screen Privacy */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
        <div className="pr-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Lock-Screen Privacy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hide child names and medical details on device lock-screen previews (displays generic notification).
          </p>
        </div>
        <input
          type="checkbox"
          checked={lockScreenPrivacy}
          onChange={(e) => setLockScreenPrivacy(e.target.checked)}
          className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all"
      >
        Save Notification Preferences
      </button>
    </div>
  );
};
