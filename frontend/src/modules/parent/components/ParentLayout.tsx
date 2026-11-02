import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useParentChild } from '../context/ParentChildContext';
import { ChildSwitcher } from './ChildSwitcher';

interface ParentLayoutProps {
  children: React.ReactNode;
}

export const ParentLayout: React.FC<ParentLayoutProps> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { unreadMessagesCount, unreadNotificationsCount } = useParentChild();
  const location = useLocation();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const tabs = [
    { to: '/parent', label: t('parentToday', 'Today'), icon: 'wb_sunny' },
    { to: '/parent/children', label: t('parentChildren', 'Children'), icon: 'child_care' },
    {
      to: '/parent/messages',
      label: t('parentMessages', 'Messages'),
      icon: 'chat',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
    {
      to: '/parent/notifications',
      label: t('parentAlerts', 'Alerts'),
      icon: 'notifications',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
    { to: '/parent/account', label: t('parentAccount', 'Account'), icon: 'account_circle' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B0F19] text-[#22283A] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar with Glassmorphic Texture */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E3DCCE] dark:border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Greeting */}
          <Link to="/parent" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary-600 to-amber-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">family_restroom</span>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                {t('parentPortal', 'Daycare Portal')}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'ሰላም፣ ' : 'Hi, '}
                {user?.firstName || (language === 'am' ? 'ወላጅ' : 'Parent')}
              </span>
            </div>
          </Link>

          {/* Child Switcher on Desktop & Tablet */}
          <div className="hidden sm:flex items-center">
            <ChildSwitcher />
          </div>

          {/* Right Header Utility Actions: Theme Toggle, Language Toggle, Emergency Call, Staff Dashboard */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title={isDark ? t('lightMode', 'Light Mode') : t('darkMode', 'Dark Mode')}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('am')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                  language === 'am'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="ወደ አማርኛ ቀይር"
              >
                አማ
              </button>
            </div>

            {/* Optional Staff Switcher for Admins Previewing */}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold transition-colors border border-primary-200 dark:border-primary-800"
                title={t('staffDashboard', 'Staff Dashboard')}
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>{t('staffDashboard', 'Staff')}</span>
              </Link>
            )}

            {/* Emergency Hotline Button */}
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
              title={t('callCenter', 'Emergency Contact')}
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span className="hidden sm:inline">{t('callCenter', 'Call Center')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Child Switcher Bar */}
        <div className="sm:hidden mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <ChildSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 pb-24 sm:pb-20">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (5 Tabs per Spec §4.2) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#E3DCCE] dark:border-slate-800 py-1.5 px-2 shadow-lg"
        role="tablist"
        aria-label="Parent Portal Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center">
          {tabs.map((tab) => {
            const isActive =
              tab.to === '/parent'
                ? location.pathname === '/parent'
                : location.pathname.startsWith(tab.to);

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl text-center transition-all ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black leading-tight animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight mt-0.5 truncate max-w-[64px]">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 mt-0.5" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Emergency Center Call Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 dark:border-rose-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-3">
              <span className="material-symbols-outlined text-[28px]">emergency</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {language === 'am' ? 'የማቆያው የአደጋ ጊዜ አድራሻዎች' : 'Center Emergency Contacts'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {language === 'am'
                ? 'ልጅዎ አፋጣኝ እርዳታ የሚያስፈልገው ከሆነ ወይም የአስተማሪዎችን ድጋፍ ከፈለጉ፡'
                : 'If your child requires urgent attention or you need to reach classroom staff immediately:'}
            </p>

            <div className="mt-4 space-y-2">
              <a
                href="tel:+15552345678"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-600">call</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {language === 'am' ? 'የማቆያው ዋና ዴስክ' : 'Main Daycare Desk'}
                    </span>
                    <span className="text-xs text-slate-500">+1 (555) 234-5678</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary-600">
                  {language === 'am' ? 'ደውል' : 'Call Now'}
                </span>
              </a>

              <a
                href="tel:+15559870000"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-600">e911_emergency</span>
                  <div>
                    <span className="font-bold text-xs text-rose-900 dark:text-rose-100 block">
                      {language === 'am' ? 'የዳይሬክተር የአደጋ ጊዜ ስልክ' : 'Emergency Director Hotline'}
                    </span>
                    <span className="text-xs text-rose-600 dark:text-rose-400">+1 (555) 987-0000</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600">
                  {language === 'am' ? 'ደውል' : 'Call'}
                </span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowEmergencyModal(false)}
              className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {t('close', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
